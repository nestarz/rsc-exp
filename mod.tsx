// @deno-types="@types/react-dom/server"
import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server.edge";
import { createRouter } from "jsr:@fartlabs/rt@0.0.2";
import App from "./app/App.tsx";
import { renderToReadableStream } from "./islet-rsc/renderToReadableStream.ts";
import { _log } from "./islet-rsc/renderToReadableStream.ts";
import { setupClientComponents } from "./islet-rsc/mod.ts";

import { use } from "react";
import { injectRSCPayload } from "npm:rsc-html-stream/server";
import { createFromReadableStream } from "react-server-dom-esm/client.browser";
import { join } from "jsr:@std/path@0.225.0/join";
import { toFileUrl } from "jsr:@std/path@0.225.0/to-file-url";
import { fromFileUrl } from "jsr:@std/path@0.213/from_file_url";

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
