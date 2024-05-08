"use client";

import { useState } from "react";

export const HiddenCounter = () => {
  const [counter, setCounter] = useState(0);

  return (
    <button type="button" onClick={() => setCounter(counter + 1)}>
      HiddenCounter: {counter}
    </button>
  );
};
