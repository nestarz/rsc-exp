import { createFromReadableStream } from "react-server-dom-esm/client.browser";
import { ReactElement, Usable, use } from "react";
import ReactDOM from "react-dom/client";
import { rscStream } from "npm:rsc-html-stream/client";

let data: Usable<ReactElement>;
const Content = ({ stream }: { stream: ReadableStream }) => {
  data ??= createFromReadableStream(stream, { callServer: console.log });
  return use(data);
};

ReactDOM.hydrateRoot(
  document.body,
  <Content stream={rscStream} />,
);
