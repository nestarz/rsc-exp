// @deno-types="@types/react"
import { use } from "react";
import { createRouter } from "@fartlabs/rt";
import { setupClientComponents } from "@bureaudouble/rsc-engine";
// @deno-types="@types/react-dom/server"
import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server.edge";
import { renderToReadableStream } from "react-server-dom-esm/server.edge";
import { createFromReadableStream } from "react-server-dom-esm/client.browser";
import { injectRSCPayload } from "rsc-html-stream/server";
import { join } from "@std/path/join";
import { toFileUrl } from "@std/path/to-file-url";
import { fromFileUrl } from "@std/path/from-file-url";
import App from "./app/App.tsx";

const _log = (response: ReadableStream) => {
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

const moduleBaseURL = import.meta.resolve("./app");
const { bootstrapModules } = await setupClientComponents({
  moduleBaseURL,
  importMap: import.meta.resolve("./deno.json"),
  bootstrapModules: [import.meta.resolve("./app/client.tsx")],
  entryPoints: [
    import.meta.resolve("./mod.tsx"),
    import.meta.resolve("./app/components/HiddenCounter.tsx"),
  ],
});

const router = createRouter()
  .get("/", async () => {
    try {
      const moduleBasePath = fromFileUrl(moduleBaseURL);
      const rscStream = renderToReadableStream(<App />, moduleBasePath);
      const [s1, s2] = rscStream.tee();
      let data;
      const Content = ({ stream }: { stream: ReadableStream }) => {
        data ??= createFromReadableStream(stream, { moduleBaseURL });
        return use(data);
      };
      const htmlStream = await renderHTMLToReadableStream(
        <Content stream={s1} />,
        { bootstrapModules },
      );
      const response = _log(htmlStream.pipeThrough(injectRSCPayload(s2)));
      return new Response(response, {
        headers: {
          // "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    } catch (error) {
      console.error(error);
    }
  })
  .get("/*", async (ctx) => {
    const rawfilename = toFileUrl(join(Deno.cwd(), "/dist/", ctx.params[0]));
    const filename = rawfilename.href.replace(/\.ts(x|)/gi, ".js");
    const response = await fetch(filename).catch(() => null);
    const size = response?.headers.get("content-length");
    if (!response?.body) return new Response(null, { status: 404 });
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/javascript",
        "Cache-Control": "no-cache",
        ...(size ? { "content-length": String(size) } : {}),
      },
    });
  })
  .default(() => new Response("Not found", { status: 404 }));

Deno.serve({ port: 4500 }, (request) => router.fetch(request));
