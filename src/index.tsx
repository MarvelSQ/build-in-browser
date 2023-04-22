import { Button, Space } from "antd";
import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Code from "./Code";
import FilePicker from "./FilePicker";
import "./index.css";
import { getChildren, resolveFile } from "./utils/filehandle";
import { Handler } from "./utils/message";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.ts?dev-sw", {
    type: "module",
  });
}

function openDirectory() {
  return window.showDirectoryPicker().catch((err) => {
    console.log("Failed to open directory picker");
    console.error(err);
    return null;
  });
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

  const directoryHandleRef = useRef<FileSystemDirectoryHandle | null>(null);

  const [treeData, setTreeData] = useState<{}[]>([]);

  const [file, setFile] = useState<{
    filePath: string;
    code: string;
  } | null>(null);

  return (
    <>
      <Space.Compact block>
        <Button
          onClick={() => {
            openDirectory().then(async (res) => {
              directoryHandleRef.current = res;
              if (res) {
                const items = await getChildren(res);
                setTreeData(items);
              }

              const result = await resolveFile(
                res as FileSystemDirectoryHandle,
                "node_modules/.pnpm/@babel+code-frame@7.16.7/node_modules/@babel/code-frame/lib"
              );

              console.log(result);
            });
            // setOpenFrame((openFrame) => !openFrame);

            // const module = `${window.location.origin}/demo/test`;
            // import(module).then((res) => console.log(res));
          }}
        >
          {directoryHandleRef.current
            ? directoryHandleRef.current.name
            : "Select Directory"}
        </Button>
        <FilePicker
          type="file"
          treeData={treeData}
          onSelect={(path) => {
            resolveFile(
              directoryHandleRef.current as FileSystemDirectoryHandle,
              path
            ).then((res) => {
              if (res.type === "file") {
                setFile({
                  filePath: path,
                  code: res.fileContent as string,
                });
              }
            });
          }}
        />
        {openFrame && <iframe src="/demo/test" />}
      </Space.Compact>
      <Code filePath={file?.filePath} code={file?.code} />
    </>
  );
}

const container = createRoot(document.getElementById("root") as HTMLDivElement);

container.render(<App />);
