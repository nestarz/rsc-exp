// @deno-types="@types/react-dom/server"
import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server.edge";
import { createRouter } from "jsr:@fartlabs/rt@0.0.2";
import App from "./app/App.tsx";
import { log, renderToReadableStream } from "./islet-rsc/mod.ts";
import { join, toFileUrl } from "jsr:@std/path@0.225.0";
import { use } from "react";
import { injectRSCPayload } from "npm:rsc-html-stream/server";
import { createFromReadableStream } from "react-server-dom-esm/client.browser";

const router = createRouter()
  .get("/", async () => {
    const moduleBasePath = "";
    const options = {
      onError: console.error,
      identifierPrefix: undefined,
      onPostpone: undefined,
    };
    const rscStream = renderToReadableStream(<App />, moduleBasePath, options);
    const [s1, s2] = rscStream.tee();
    let data;
    const Content = ({ stream }: { stream: ReadableStream }) => {
      data ??= createFromReadableStream(stream);
      return use(data);
    };
    const htmlStream = await renderHTMLToReadableStream(
      <Content stream={s1} />,
      { bootstrapModules: ["./Users/elias/code/bureaudouble/islet-jsr/client.js"] },
    );
    const response = log(htmlStream.pipeThrough(injectRSCPayload(s2)));
    console.log(response);
    return new Response(response, {
      headers: {
        // "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  })
  .get(
    "/Users/elias/code/bureaudouble/islet-jsr/app/components/Counter.tsx",
    async () =>
      new Response(
        await Deno.readTextFile("./dist/app/components/Counter.js"),
        {
          headers: {
            "Content-Type": "text/javascript",
            "Cache-Control": "no-cache",
          },
        },
      ),
  )
  .get(
    "/Users/elias/code/bureaudouble/islet-jsr/client.js",
    async () =>
      new Response(await Deno.readTextFile("./dist/client.js"), {
        headers: {
          "Content-Type": "text/javascript",
          "Cache-Control": "no-cache",
        },
      }),
  )
  .get(
    "/Users/elias/code/bureaudouble/islet-jsr/chunk-PM5MJUDO.js",
    async () =>
      new Response(await Deno.readTextFile("./dist/chunk-PM5MJUDO.js"), {
        headers: {
          "Content-Type": "text/javascript",
          "Cache-Control": "no-cache",
        },
      }),
  )
  .default(() => new Response("Not found", { status: 404 }));

Deno.serve({ port: 4500 }, (request) => router.fetch(request));
