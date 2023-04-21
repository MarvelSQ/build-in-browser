type ValueWrapper =
  | {
      type: "value";
      value: any;
    }
  | {
      type: "function";
    };

const structuralize = (props: Record<string, any>) => {
  return Object.entries(props).reduce((acc, [key, value]) => {
    acc[key] =
      typeof value === "function"
        ? {
            type: "function",
          }
        : {
            type: "value",
            value,
          };
    return acc;
  }, {} as typeof props);
};

enum MessageType {
  REQUEST_INSTANCE = "REQUEST_INSTANCE",
  HANDLE_INSTANCE = "HANDLE_INSTANCE",
  REMOVE_INSTANCE = "REMOVE_INSTANCE",
  UPDATE_FIELD = "UPDATE_FIELD",
  REMOVE_FIELD = "REMOVE_FIELD",
  INSTANCE_CALL = "INSTANCE_CALL",
  INSTANCE_CALL_RESULT = "INSTANCE_CALL_RESULT",
}

class Handler {
  listenerPromise: Promise<any>;

  listenerPromiseResolve: ((value: any) => void) | undefined;

  handle: Record<string, any>;

  targetHandle: Record<string, any> | undefined;

  targetPromise: Promise<Record<string, any>>;

  targetPromiseResolve: ((value: any) => void) | undefined;

  constructor(handle: Record<string, any>) {
    this.handle = handle;
    this.targetPromise = new Promise((resolve) => {
      this.targetPromiseResolve = resolve;
    });

    this.listenerPromise = new Promise((resolve) => {
      this.listenerPromiseResolve = resolve;
    });
  }

  listen(data: any) {
    switch (data.type) {
      case MessageType.REQUEST_INSTANCE:
        this.send({
          type: MessageType.HANDLE_INSTANCE,
          handle: structuralize(this.handle),
        });
        break;
      case MessageType.HANDLE_INSTANCE:
        const { handle } = data as { handle: Record<string, ValueWrapper> };
        const nextHandle = Object.entries(handle).reduce(
          (acc, [key, value]) => {
            if (value.type === "function") {
              acc[key] = (...args: any[]) => {
                const id = (Math.random() * 1000).toString(36);

                this.send({
                  type: MessageType.INSTANCE_CALL,
                  key,
                  args,
                  id,
                });

                return new Promise((resolve) => {
                  this.addCallListener((data: any) => {
                    if (data.id === id) {
                      resolve(data.result);
                      return true;
                    }
                  });
                });
              };
            } else {
              acc[key] = value.value;
            }
            return acc;
          },
          {} as any
        );
        // 初次更新通知
        if (!this.targetHandle) {
          this.targetPromiseResolve?.(this.targetHandle);
        }
        this.targetHandle = nextHandle;
        this.handleChangeListener.forEach((cb) => cb(this.targetHandle as any));
        break;
      case MessageType.REMOVE_INSTANCE:
        this.targetHandle = undefined;
        break;
      case MessageType.UPDATE_FIELD:
        const { key, value } = data;
        if (this.targetHandle) this.targetHandle[key] = value;
        break;
      case MessageType.REMOVE_FIELD:
        const { key: key2 } = data;
        if (this.targetHandle) this.targetHandle[key2] = undefined;
        break;
      case MessageType.INSTANCE_CALL:
        const { key: key3, args, id } = data;

        Promise.resolve(this.handle[key3](...args)).then((result) => {
          this.send({
            type: MessageType.INSTANCE_CALL_RESULT,
            key: key3,
            id,
            result,
          });
        });
        break;
      case MessageType.INSTANCE_CALL_RESULT:
        this.callListeners = this.callListeners.filter((cb) => {
          const result = cb(data);
          return !result;
        });
        break;
    }
  }

  setListener(cb: (data: any) => void) {
    this.listenerPromiseResolve?.(cb);
  }

  callListeners: ((data: any) => boolean | undefined)[] = [];

  addCallListener(cb: (data: any) => boolean | undefined) {
    this.callListeners.push(cb);
  }

  send(data: any) {
    this.listenerPromise.then((listener) => {
      listener(data);
    });
  }

  sendHandle() {
    this.send({
      type: MessageType.HANDLE_INSTANCE,
      handle: structuralize(this.handle),
    });
  }

  updateHandle(handle: Record<string, any>) {
    this.handle = handle;
    this.send({
      type: MessageType.HANDLE_INSTANCE,
      handle: structuralize(handle),
    });
  }

  requestInstance() {
    this.send({
      type: MessageType.REQUEST_INSTANCE,
    });
  }

  getTargetHandle() {
    return this.targetPromise.then(() => {
      return new Proxy(this.targetHandle || {}, {
        get: (target, key) => {
          return target[key as string];
        },
        set() {
          return false;
        },
      });
    });
  }

  handleChangeListener: ((handle: Record<string, any>) => void)[] = [];

  onHandleChange(cb: (handle: Record<string, any>) => void) {
    this.handleChangeListener.push(cb);
  }

  removeHandleChangeListener(cb: (handle: Record<string, any>) => void) {
    this.handleChangeListener = this.handleChangeListener.filter(
      (listener) => listener !== cb
    );
  }
}

// const handle = new Handler({
//   a: 1,
//   onResolve(path: string) {
//     console.log("onResolve", path);

//     return {
//       filePath: path,
//       fileContent: "export default () => console.log('hello world')",
//     }
//   }
// });

// handle.start();

export { Handler };

// export function createChannel(instance: Record<string, any>) {
//   const channel = new MessageChannel();

//   let propsDesc = null;

//   let calls: Record<string, (res: any) => void> = {};

//   channel.port1.onmessage = (event) => {
//     if (event.data?.type === "startChannel") {
//       channel.port1.postMessage({
//         type: "handle",
//         props: structuralize(instance),
//       });
//     }
//     if (event.data.type === "handle") {
//       const { props } = event.data;
//       propsDesc = props;
//     }
//     if (event.data.type === "call") {
//       const { key, args, id } = event.data;
//       async function call() {
//         const func = instance[key];

//         const result = await func(...args);

//         channel.port1.postMessage({
//           type: "result",
//           key,
//           id,
//           result,
//         });
//       }
//       call();
//     }
//     if (event.data.type === "result") {
//       const { key, id, result } = event.data;

//       calls[id]?.(result);
//     }
//     if (event.data.type === "value") {
//       const { key, value } = event.data;
//     }
//   };

//   return {
//     port: channel.port2,
//     args: [
//       {
//         type: "initChannel",
//       },
//       [channel.port1],
//     ],
//     call(key: string, args: any[]) {
//       const id = `${key}-${Math.random()}`;

//       return new Promise((resolve) => {
//         calls[id] = (res) => {
//           calls[id] = undefined;
//           resolve(res);
//         };
//       });
//     },
//   };
// }

// export function receiveChannel(event: MessageEvent) {
//   if (event.data?.type === "initChannel" && event.ports[0]) {
//     event.ports[0].postMessage({
//       type: "startChannel",
//     });

//     event.ports[0].onmessage = (event) => {
//       console.log(event);
//     };
//   }
// }

// class RemoteControl {
//   listeners: ((event: MessageEvent) => void)[] = [];

//   constructor() {}

//   receiveMessage(event: MessageEvent) {}

//   addListener(cb: (event: MessageEvent) => void) {
//     this.listeners.push(cb);
//   }
// }

// const control = new RemoteControl();

// const channel = new MessageChannel();

// channel.port1.onmessage = (event) => {
//   control.receiveMessage(event);
// };

// control.addListener((event) => {
//   channel.port1.postMessage(event.data);
// });

// control.onPropsChange((props) => {});
