"use client";
import {
  __toESM,
  require_jsx_runtime,
  require_react
} from "../../chunk-PM5MJUDO.js";

// app/components/Counter.tsx
var import_react = __toESM(require_react());
var import_jsx_runtime = __toESM(require_jsx_runtime());
var Counter_ = () => {
  const [counter, setCounter] = (0, import_react.useState)(0);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", onClick: () => setCounter(counter + 1), children: [
    "Counter: ",
    counter
  ] });
};
var Counter = () => (0, import_react.createElement)({
  $$typeof: Symbol.for("react.client.reference"),
  $$id: import.meta.url.concat("#Counter_").slice(7),
  $$async: false
});
export {
  Counter,
  Counter_
};
