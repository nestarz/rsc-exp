// @deno-types="@types/react/jsx-runtime"
import * as JSX from "react/jsx-runtime";
import { fromFileUrl } from "jsr:@std/path@0.225.0/posix/from-file-url";
import entrypoints from "../entrypoints.json" with { type: "json" };

let modules: any[];
setTimeout(async () => {
  function reverseMap<K extends string, V>(obj: Record<K, V>): Map<V, K> {
    return new Map(Object.entries(obj).map(([key, value]) => [value, key]));
  }
  modules = await Promise.all(
    entrypoints.map(async (specifier) => ({
      specifier,
      module: reverseMap(
        await import(specifier),
      ),
    })),
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
