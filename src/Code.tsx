import monaco from "monaco-editor";
import ReactEditor, { loader, Monaco } from "@monaco-editor/react";
import { useEffect, useRef } from "react";

function initMonaco(monaco: Monaco) {
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    allowNonTsExtensions: true,
    // allowJs: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    allowSyntheticDefaultImports: true,
  });
}

const cache = new Map<string, string>();

function Code({ filePath, code }: { filePath?: string; code?: string }) {
  const monacoRef = useRef<Monaco | null>(null);

  useEffect(() => {
    // 直接解析 react/jsx-runtime
    // onResolve("react/jsx-runtime").then((res) => {
    //   res.forEach((item) => {
    //     monacoRef.current?.languages.typescript.typescriptDefaults.addExtraLib(
    //       item.fileContent,
    //       `file:///${item.filePath}`
    //     );
    //   });
    // });
  }, []);

  useEffect(() => {
    // if (filePath.match(/(js|jsx|ts|tsx)$/) && code && monacoRef.current) {
    //   if (cache.has(filePath)) {
    //     return;
    //   }
    //   onResolveDependencies(filePath, code).then((res) => {
    //     res.forEach((item) => {
    //       monacoRef.current?.languages.typescript.typescriptDefaults.addExtraLib(
    //         item.fileContent,
    //         `file:///${item.filePath}`
    //       );
    //     });
    //   });
    // }
  }, [code]);

  return (
    <ReactEditor
      className="code-editor"
      theme="vs-dark"
      path={filePath ? `file:///${filePath}` : undefined}
      value={code}
      beforeMount={(monaco) => {
        monacoRef.current = monaco;
        initMonaco(monaco);
      }}
    />
  );
}

export default Code;
