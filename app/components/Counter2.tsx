"use client";

import { useState } from "react";

export const Counter2 = () => {
  const [counter, setCounter] = useState(0);

  return (
    <button type="button" onClick={() => setCounter(counter + 1)}>
      Counter2: {counter}
    </button>
  );
};
