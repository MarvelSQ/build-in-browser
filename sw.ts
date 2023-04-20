import { clientsClaim } from "workbox-core";
import { Handler } from "./src/utils/message";

self.skipWaiting();
clientsClaim();

console.log("service worker...");

const handler = new Handler({
  reload() {
    return true;
  },
});

self.addEventListener("message", (event) => {
  console.log("message", event);

  if (event.data.type === "initChannel" && event.ports[0]) {
    const port = event.ports[0];

    handler.setListener((payload) => {
      port.postMessage({
        type: "HANDLER",
        payload,
      });
    });

    port.onmessage = (event) => {
      console.log("port message", event);

      if (event.data.type === "HANDLER") {
        handler.listen(event.data.payload);
      }
    };

    handler.requestInstance();

    handler.getTargetHandle().then((handle) => {
      handle.onResolve("demo").then((res) => {
        console.log("onResolve", res);
      });
    });
  }
});

self.addEventListener("fetch", (event) => {
  console.log("fetch", event);

  if (event.request.url === "http://localhost:5173/demo/test") {
    event.respondWith(
      new Response(
        'export default () => console.log("loading from service worker")',
        {
          headers: {
            "Content-Type": "application/javascript",
          },
        }
      )
    );
    return;
  }

  event.respondWith(fetch(event.request));
});
