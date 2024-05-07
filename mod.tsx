import { renderToString } from "react-dom/server";
import { createRouter } from "jsr:@fartlabs/rt@0.0.2";
import App from "./app/App.tsx";
import { renderToResponse } from "./islet-rsc/mod.ts";

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
  .get("/app", (request) => renderToResponse(<App {...request} />))
  .default(() => new Response("Not found", { status: 404 }));

Deno.serve({ port: 4500 }, (request) => router.fetch(request));
