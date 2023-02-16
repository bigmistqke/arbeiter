import {
  Config,
  FilterObjectForFunction,
  Promisify,
  StateCallback,
} from "./types";

// a random string as identifier since we can not send symbols to workers
// TODO: randomize the string for security reasons
const FUNCTION = "aeipgjaeigjaeijaoejogoaekogkeogakeogka";

class Arbeiter<STATE, CONFIG extends Config<STATE>> {
  methods: Promisify<FilterObjectForFunction<STATE>>;
  private options: Config<STATE>;
  private worker: Worker;
  private messageId = 0;
  private responseQueue: {
    [key: number]: { resolve: (value: unknown) => void };
  } = {};

  constructor(methodsCallback: StateCallback<STATE, CONFIG>, options: CONFIG) {
    const methods = methodsCallback();
    this.worker = this.getWorker(methodsCallback);
    this.worker.onmessage = this.onmessage;
    this.methods = this.getMethods(methods);
    this.options = this.getOptions(options);
    return this;
  }

  private getOptions = (options: Partial<CONFIG>) => {
    const methodOptions = Object.fromEntries(
      Object.keys(this.methods).map(key => [
        key,
        { eval: !!options.eval, resolve: !!options.resolve },
      ])
    );

    const defaultOptions = {
      eval: true,
      resolve: !!options.resolve,
      methods: methodOptions,
    } as CONFIG;

    return { ...defaultOptions, ...options };
  };

  private getMethods = (m: { [key: string]: any }) =>
    Object.fromEntries(
      Object.entries(m)
        .filter(([_, value]) => typeof value === "function")
        .map(([key, _]) => [
          key,
          (...args: any[]) =>
            new Promise(resolve => {
              this.messageId++;
              this.responseQueue[this.messageId] = { resolve };

              const transferables = args.filter(
                v =>
                  v instanceof ArrayBuffer ||
                  v instanceof MessagePort ||
                  v instanceof ReadableStream ||
                  v instanceof WritableStream ||
                  v instanceof TransformStream ||
                  // AudioData is `experimental technology`
                  // v instanceof AudioData ||
                  v instanceof ImageBitmap ||
                  // VideoFrame is `experimental technology`
                  // v instanceof VideoFrame ||
                  v instanceof OffscreenCanvas ||
                  v instanceof RTCDataChannel
              );

              for (const index in args) {
                if (typeof args[index] === "function")
                  // to be able to pass a function to the worker
                  // we .toString() functions so the function can be `eval`ed later
                  // and set the index as an object with the random id FUNCTION as  key
                  // to be able to identify it in the worker as a function
                  args[index] = {
                    [FUNCTION]: args[index].toString(),
                  };
              }

              const options = this.options.methods[key] ?? {
                resolve: this.options.resolve,
                eval: this.options.eval,
              };

              this.worker.postMessage(
                {
                  type: "user",
                  data: [this.messageId, key, args],
                  // TODO: type-error
                  options,
                },
                transferables
              );
            }),
        ])
    ) as unknown as Promisify<FilterObjectForFunction<STATE>>;

  private onmessage = (
    message: MessageEvent<[id: number, key: string, value: any]>
  ) => {
    const [id, value] = message.data;
    if (!this.responseQueue) return;
    this.responseQueue[id].resolve(value);
    delete this.responseQueue[id];
  };

  private getWorkerString = (m: StateCallback<STATE, CONFIG>) =>
    `
const symbol = Symbol('arbeiter-function')
const methods = (${m.toString()})();

onmessage = function ({data}) {
  if(data.type === 'user'){
    
    const [id, key, args] = data.data
    let value;
    for (const index in args) {
      value = args[index]
      if (typeof value === 'object' && '${FUNCTION}' in value && data.options.eval) {
        args[index] = eval(value.${FUNCTION})
      }
    }
    const response = methods[key](...args);
    if("options" in data && !data.options.resolve) return
    postMessage([id, response])
    return;
  }
}
    `;

  private getWorker = (m: StateCallback<STATE, CONFIG>) =>
    new Worker(
      "data:text/javascript;charset=utf-8," +
        encodeURIComponent(this.getWorkerString(m))
    );

  terminate() {
    this.worker.terminate();
  }
}

export default class Factory<STATE> {
  arbeiters: Arbeiter<any, any>[] = [];

  construct<CONFIG extends Config<STATE>>(
    methodsCallback: StateCallback<STATE, CONFIG>,
    options?: CONFIG
  ) {
    const defaultOptions = {
      eval: true,
      resolve: true,
    } as CONFIG;

    const arbeiter = new Arbeiter<STATE, CONFIG>(
      methodsCallback,
      options ?? defaultOptions
    );
    this.arbeiters.push(arbeiter);
    return arbeiter;
  }

  terminate() {
    this.arbeiters.forEach(arbeiter => arbeiter.terminate());
  }
}
