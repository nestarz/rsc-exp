import { Suspense } from "react";
import { Counter } from "./components/Counter.tsx";
import { Counter2 } from "./components/Counter2.tsx";
import { createElement } from "react";
import { fromFileUrl } from "jsr:@std/path@0.225.0/posix/from-file-url";

async function delay(ms: number) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

const AsyncC = async () => {
  await delay(1000);
  return (
    <>
      <h1>AsyncC!2</h1>
      {new Date().toISOString()}
      <Counter2 />
    </>
  );
};

export default async () => {
  return (
    <html>
      <body>
        <h1>Hello World!</h1>
        {new Date().toISOString()}
        <Suspense fallback="loading...">
          <AsyncC />
        </Suspense>
        <Counter />
        {createElement({
          $$typeof: Symbol.for("react.client.reference"),
          $$id: fromFileUrl(
            import.meta.resolve("./components/HiddenCounter.tsx"),
          ).concat("#HiddenCounter"),
          $$async: false,
        })}
      </body>
    </html>
  );
};
