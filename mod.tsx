import { renderToPipeableStream } from "react-server-dom-esm/server.node";
import { join, toFileUrl } from "jsr:@std/path@0.225.0";
import { PassThrough, Readable } from "node:stream";
import { renderToString } from "react-dom/server";
import { createRouter } from "jsr:@fartlabs/rt@0.0.2";

async function delay(ms: number) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

async function App() {
  await delay(500);
  return (
    <>
      <h1>Hello World!</h1>
      {new Date().toISOString()}
    </>
  );
}

export function renderToReadableStream(
  model: Parameters<typeof renderToPipeableStream>[0],
  moduleBasePath: Parameters<typeof renderToPipeableStream>[1],
  options: Parameters<typeof renderToPipeableStream>[2],
): ReadableStream {
  const stream = renderToPipeableStream(model, moduleBasePath, options);
  const jsxStream = stream.pipe(new PassThrough());
  return Readable.toWeb(jsxStream) as ReadableStream;
}

const route = () => {
  const moduleBasePath = toFileUrl(join(Deno.cwd(), "src")).href;
  const options = {
    onError: console.error,
    identifierPrefix: undefined,
    onPostpone: undefined,
  };
  const stream = renderToReadableStream(<App />, moduleBasePath, options);
  return new Response(stream, {
    headers: { "Content-Type": "text/x-component; charset=utf-8" },
  });
};

import * as esbuild from "npm:esbuild@0.20.2";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.10.3";

const result = await esbuild.build({
  plugins: [
    ...denoPlugins({ importMapURL: import.meta.resolve("./deno.json") }),
  ],
  entryPoints: [import.meta.resolve("./client.tsx")],
  outfile: "./dist/bytes.esm.js",
  bundle: true,
  format: "esm",
  jsx: "automatic",
});

console.log(result.outputFiles);
esbuild.stop();

const router = createRouter()
  .get("/", async () => {
    return new Response(
      renderToString(
        <body>
          <div id="root" />
          <script
            dangerouslySetInnerHTML={{
              __html: await Deno.readTextFile(
                new URL(import.meta.resolve("./dist/bytes.esm.js")),
              ),
            }}
          />
        </body>,
      ),
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      },
    );
  })
  .get("/app", route)
  .default(() => new Response("Not found", { status: 404 }));

Deno.serve({ port: 4500 }, (request) => router.fetch(request));
