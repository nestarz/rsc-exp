"use client";
import {
  __toESM,
  require_jsx_runtime,
  require_react
} from "../../chunk-PM5MJUDO.js";

// app/components/Counter2.tsx
var import_react = __toESM(require_react());
var import_jsx_runtime = __toESM(require_jsx_runtime());
var Counter2 = () => {
  const [counter, setCounter] = (0, import_react.useState)(0);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", onClick: () => setCounter(counter + 1), children: [
    "Counter2: ",
    counter
  ] });
};
export {
  Counter2
};
