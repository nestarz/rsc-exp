import { Suspense } from "react";

async function delay(ms: number) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

const AsyncC = async () => {
  await delay(1500);
  return (
    <>
      <h1>AsyncC!</h1>
      {new Date().toISOString()}
    </>
  );
};

export default async () => {
  await delay(500);
  return (
    <>
      <h1>Hello World!</h1>
      {new Date().toISOString()}
      <Suspense>
        <AsyncC />
      </Suspense>
    </>
  );
};
