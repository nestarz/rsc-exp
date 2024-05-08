// @deno-types="@types/react/jsx-runtime"
import * as JSX from "react/jsx-runtime";
import { fromFileUrl } from "jsr:@std/path@0.225.0/posix/from-file-url";
import { join } from "jsr:@std/path@0.225.0/join";
import { toFileUrl } from "jsr:@std/path@0.225.0/to-file-url";

const entrypoints = await import("../entrypoints.json", {
  assert: { type: "json" },
}).then((v) => v.default ?? []).catch(() => []);

let modules: any[];
setTimeout(async () => {
  const reverseMap = <K extends string | number | symbol, V>(
    obj: Record<K, V>,
  ): Map<V, K> =>
    new Map(Object.entries(obj).map(([key, value]) => [value, key])) as any;
  modules = await Promise.all(
    entrypoints.map((specifier) => toFileUrl(join(Deno.cwd(), specifier))).map(
      async (
        specifier,
      ) => ({ specifier, module: reverseMap(await import(specifier.href)) }),
    ),
  );
});

export const jsx: typeof JSX.jsx = (type, props, key) => {
  const clientComponent = modules.find((v) => v.module.get(type));
  return clientComponent
    ? JSX.jsx({
      $$typeof: Symbol.for("react.client.reference"),
      $$id: (new URL(clientComponent.specifier).protocol === "file:"
        ? fromFileUrl(clientComponent.specifier)
        : clientComponent.specifier).concat("#").concat(
          type.name,
        ),
      $$async: false,
    }, {})
    : JSX.jsx(type, props, key);
};
export const jsxs: typeof JSX.jsxs = jsx;

// @deno-types="@types/react/jsx-runtime"
export { Fragment } from "react/jsx-runtime";
