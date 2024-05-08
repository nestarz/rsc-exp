import type { JSX } from "react";
import { renderToPipeableStream } from "react-server-dom-esm/server.node";
import { join, toFileUrl } from "jsr:@std/path@0.225.0";
import { PassThrough, Readable } from "node:stream";

export function renderToReadableStream(
  model: Parameters<typeof renderToPipeableStream>[0],
  moduleBasePath: Parameters<typeof renderToPipeableStream>[1],
  options: Parameters<typeof renderToPipeableStream>[2],
): ReadableStream {
  const stream = renderToPipeableStream(model, moduleBasePath, options);
  const jsxStream = stream.pipe(new PassThrough());
  return Readable.toWeb(jsxStream) as ReadableStream;
}

export const log = (response: ReadableStream) => {
  const [response1, response2] = response.tee();
  const reader = response2.getReader();
  const Decoder = new TextDecoder();
  async function readHtml() {
    const { done, value } = await reader.read();
    console.log(Decoder.decode(value));
    if (!done) readHtml();
  }
  readHtml();
  return response1;
};

export const renderToResponse = (model: JSX.Element) => {
  const moduleBasePath = toFileUrl(join(Deno.cwd(), "src")).href;
  const options = {
    onError: console.error,
    identifierPrefix: undefined,
    onPostpone: undefined,
  };
  const stream = renderToReadableStream(model, moduleBasePath, options);
  return new Response(stream, {
    headers: { "Content-Type": "text/x-component; charset=utf-8" },
  });
};

import * as esbuild from "npm:esbuild@0.20.2";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.10.3";
import { info } from "../info.ts";

const infos = await info(import.meta.resolve("../mod.tsx"), {
  importMap: toFileUrl(join(Deno.cwd(), "./deno.json")).href,
});

const modules = await Promise.all(
  infos.modules
    .filter((module) => new URL(module.specifier).protocol === "file:")
    .map(async (module) => {
      const response = await fetch(module.specifier);
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

const entryPoints = modules.filter((v) => v.mode === "client").map((v) =>
  v.module.specifier
);

const value = JSON.stringify(
  entryPoints.map((v) => v.replace(toFileUrl(Deno.cwd()), "")),
);
const previous = await Deno.readTextFile("./entrypoints.json");
if (previous !== value) await Deno.writeTextFile("./entrypoints.json", value);

const result = await esbuild.build({
  plugins: [
    ...denoPlugins({
      importMapURL: toFileUrl(join(Deno.cwd(), "./deno.json")).href,
    }),
  ],
  entryPoints: [
    ...entryPoints,
    toFileUrl(join(Deno.cwd(), "./client.tsx")).href,
  ],
  outdir: "./dist/",
  bundle: true,
  splitting: true,
  metafile: true,
  treeShaking: true,
  format: "esm",
  jsx: "automatic",
});

esbuild.stop();
