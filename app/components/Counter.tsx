"use client";

import { createElement, useState } from "react";

export const Counter_ = () => {
  const [counter, setCounter] = useState(0);

  return (
    <button type="button" onClick={() => setCounter(counter + 1)}>
      Counter: {counter}
    </button>
  );
};

export const Counter = () =>
  createElement({
    $$typeof: Symbol.for("react.client.reference"),
    $$id: import.meta.url.concat("#Counter_").slice(7),
    $$async: false,
  });
