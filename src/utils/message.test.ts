import { test, expect, vi } from "vitest";
import { Handler } from "./message";

test("message", async () => {
  const handlerA = new Handler({
    a: 1,
    onResolve(path: string) {
      return {
        filePath: path,
        fileContent: 'export default () => console.log("hello world")',
      };
    },
  });

  const handlerB = new Handler({
    a: 1,
    reload() {
      console.log("reload");
    },
  });

  handlerB.setListener((data) => {
    handlerA.listen(data);
  });

  handlerA.setListener((data) => {
    handlerB.listen(data);
  });

  handlerB.requestInstance();

  const instance = await handlerB.getTargetHandle();

  expect(instance).toMatchObject({ a: 1 });

  const resolvedContent = await instance.onResolve("test");

  expect(resolvedContent).toMatchObject({
    filePath: "test",
    fileContent: 'export default () => console.log("hello world")',
  });

  const listenHandleChange = vi.fn();

  handlerB.onHandleChange(listenHandleChange);

  handlerA.updateHandle({ a: 2 });

  await Promise.resolve();

  expect(listenHandleChange).toBeCalledWith({ a: 2 });

  handlerB.removeHandleChangeListener(listenHandleChange);

  handlerA.updateHandle({ a: 3 });

  await Promise.resolve();

  expect(listenHandleChange).toBeCalledTimes(1);
});
