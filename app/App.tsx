import { Suspense } from "react";
import { Counter } from "./components/Counter.tsx";
import { Counter2 } from "./components/Counter2.tsx";

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
      </body>
    </html>
  );
};
