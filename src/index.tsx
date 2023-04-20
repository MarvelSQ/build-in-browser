import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Handler } from "./utils/message";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.ts?dev-sw", {
    type: "module",
  });
}

function openDirectory() {
  window.showDirectoryPicker().then(async (directoryHandle) => {});
}

const channel = new MessageChannel();

const handler = new Handler({
  onResolve: (path: string) => {
    return `${path}-test`;
  },
});

navigator.serviceWorker
  .getRegistration("/sw.ts?dev-sw")
  .then((registration) => {
    if (registration?.active) {
      registration.active.postMessage(
        {
          type: "initChannel",
        },
        [channel.port2]
      );
    }
  });

handler.setListener((payload) => {
  channel.port1.postMessage({
    type: "HANDLER",
    payload,
  });
});

channel.port1.onmessage = (event) => {
  if (event.data?.type === "HANDLER") {
    handler.listen(event.data.payload);
  }
};

function App() {
  const [openFrame, setOpenFrame] = useState(false);

  return (
    <>
      <button
        onClick={() => {
          // setOpenFrame((openFrame) => !openFrame);

          const module = `${window.location.origin}/demo/test`;
          import(module).then((res) => console.log(res));
        }}
      >
        test
      </button>
      {openFrame && <iframe src="/demo/test" />}
    </>
  );
}

const container = createRoot(document.getElementById("root") as HTMLDivElement);

container.render(<App />);
