import * as esbuild from "npm:esbuild@0.20.2";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.10.3";
import { RateLimiter } from "jsr:@teemukurki/rate-limiter";
import { toFileUrl } from "jsr:@std/path@0.225.0/to-file-url";
import { info } from "./info.ts";

const limiter = new RateLimiter({ tokensPerInterval: 60, interval: "second" });

export const setupClientComponents = async (manifest: {
  entryPoints: string[];
  importMap: string;
  bootstrapModules: string[];
  moduleBaseURL: string;
}) => {
  const supportedMediaTypes = ["TSX", "JSX", "JavaScript", "TypeScript"];
  const infos = await Promise.all(
    manifest.entryPoints.map((v) => info(v, { importMap: manifest.importMap })),
  ).then((v) =>
    v
      .flatMap((v) => v.modules)
      .filter((module) => module.kind === "esm")
      .filter((module) => supportedMediaTypes.includes(module.mediaType))
  );
  const modules = await Promise.all(
    infos.map(async (module) => {
      const specifier = module.local
        ? toFileUrl(module.local)
        : await limiter.removeTokens(1).then(() => module.specifier);
      const response = await fetch(specifier);
      if (!response.body) return false;
      const reader = response.body.getReader({ mode: "byob" });
      const { value } = await reader.read(new Uint8Array(11));
      const decoder = new TextDecoder("utf-8");
      const directive = decoder.decode(value).trim().slice(1, 11);
      const map = { "use client": "client", "use server": "server" };
      const mode = directive in map
        ? map[directive as keyof typeof map]
        : "default";
      return { module, mode };
    }),
  );

  const entryPoints = modules
    .filter((v) => v.mode === "client")
    .map((v) => v.module.specifier);
  const value = JSON.stringify(
    entryPoints.map((v) => v.replace(toFileUrl(Deno.cwd()), "")),
  );
  const previous = await Deno.readTextFile("./entrypoints.json");
  if (previous !== value) await Deno.writeTextFile("./entrypoints.json", value);

  await esbuild.build({
    plugins: [...denoPlugins({ importMapURL: manifest.importMap })],
    entryPoints: [...manifest.bootstrapModules, ...entryPoints],
    outdir: "./dist/",
    bundle: true,
    splitting: true,
    metafile: true,
    treeShaking: true,
    format: "esm",
    jsx: "automatic",
  });

  esbuild.stop();

  return {
    bootstrapModules: manifest.bootstrapModules.map((v) =>
      v.replace(manifest.moduleBaseURL, "").replace(/\.ts(x|)/gi, ".js")
    ),
  };
};
