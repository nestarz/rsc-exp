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

const result = await esbuild.build({
  plugins: [
    ...denoPlugins({
      importMapURL: toFileUrl(join(Deno.cwd(), "./deno.json")).href,
    }),
  ],
  entryPoints: [
    toFileUrl(join(Deno.cwd(), "./client.tsx")).href,
    toFileUrl(join(Deno.cwd(), "./app/components/Counter.tsx")).href,
  ],
  outdir: "./dist/",
  bundle: true,
  splitting: true,
  metafile: true,
  treeShaking: true,
  format: "esm",
  jsx: "automatic",
});

console.log(result.outputFiles);
esbuild.stop();
