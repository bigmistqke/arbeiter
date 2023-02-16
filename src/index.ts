import { FilterObject } from "./ts-helpers";

type StateCallback<STATE> = () => { [K in keyof STATE]: STATE[K] };
type Promisify<T extends { [key: string]: any }> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>>;
};
type FilterFunction<T> = FilterObject<T, Function>;

export default class Werker<STATE> {
  methods: Promisify<FilterFunction<STATE>>;
  private worker: Worker;
  private messageId = 0;
  private responseQueue: {
    [key: number]: { resolve: (value: unknown) => void };
  } = {};

  constructor(m: StateCallback<STATE>) {
    this.worker = this.getWorker(m);
    this.worker.onmessage = this.onmessage;
    this.methods = this.getMethods(m);
  }

  terminate() {
    this.worker.terminate();
  }

  private getMethods = (m: StateCallback<STATE>) =>
    Object.fromEntries(
      Object.entries(m())
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
                  v instanceof AudioData ||
                  v instanceof ImageBitmap ||
                  // VideoFrame is `experimental technology`
                  v instanceof VideoFrame ||
                  v instanceof OffscreenCanvas ||
                  v instanceof RTCDataChannel
              );

              this.worker.postMessage(
                [this.messageId, key, args],
                transferables
              );
            }),
        ])
    ) as unknown as Promisify<FilterFunction<STATE>>;

  private onmessage = (
    message: MessageEvent<[id: number, key: string, value: any]>
  ) => {
    const [id, value] = message.data;
    if (!this.responseQueue) return;
    this.responseQueue[id].resolve(value);
    delete this.responseQueue[id];
  };

  private getWorkerString = (m: StateCallback<STATE>) =>
    `
const methods = (${m.toString()})();

onmessage = function ({data: [id, key, arguments]}) {
  const response = methods[key](...arguments);
  postMessage([id, response])
  return;
}
    `;

  private getWorker = (m: StateCallback<STATE>) =>
    new Worker(
      "data:text/javascript;charset=utf-8," +
        encodeURIComponent(this.getWorkerString(m))
    );
}
