# Arbeiter

A worker-helper for in-browser.</br>
- dynamically create workers with state and methods capable of manipulating state
- `postMessage` is abstracted away behind `async` method-calls
- transfer transferable objects automatically
- pass functions to workers

# How to use

- simple example

```ts
import Arbeiter from "arbeiter";

// The arbeiters' types have to be explicitly typed inside Arbeiter's generic.
const arbeiter = new Arbeiter<{ 
  counter: number; 
  increment: () => number 
}>();

const { methods, terminate } = arbeiter.construct(() => ({
  counter: 0,
  increment: function () {
    // only state accessed with `this` can be manipulated
    return this.counter++;
  },
}));

// All functions are converted into async functions
// and are accessible in `methods`
methods.increment().then(
  value => value // 1
);
```

- transfer `OffscreenCanvas`

```ts
import Factory from "arbeiter";

const arbeiter = new Arbeiter<{
  canvas?: OffscreenCanvas,
  context?:
  transfer: (canvas: OffscreenCanvas) => void
  fill: (color: string) => void
}>();

const { methods, terminate } = arbeiter.construct(() => ({
  canvas: undefined,
  transfer: function (canvas) {
    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');
  },
  fill: function(color) {
    if (!this.context) return;
    this.context.fillStyle = color;
    this.context.fillRect(0, 0, 100, 100);
  }
}));

const canvas = document.createElement('canvas');

// Transferable objects are automagically transferred
methods.transfer(canvas.transferControlToOffscreen()).then(
  () => methods.fill("red")
)
```

- function-parameters

```ts
import Arbeiter from "arbeiter";

const arbeiter = new Arbeiter<{
  func: (callback: (number: number) => void) => void;
}>();

const { methods, terminate } = arbeiter.construct(() => ({
  func: function (callback) {
    callback(Math.random());
  },
}));

// All functions passed as arguments have to be serializable 
// Variables available on `this` can be accessed and manipulated
methods.func(number => 
  console.log("random number", number)
); // worker will log `random number 0.1522...`
methods.func(number => 
  console.log("number random", number)
); // worker will log `number random 0.1522...`

// Functions can normally not be serialized with workers
// To be able to pass and execute the function
// Arbeiter uses `.toString` and `eval` under the hood 

// `eval` has performance and security implications, so be careful.
```

- options-config

```ts
// You can disable passing around and `eval`ing functions 
// with an optional secondary parameter
arbeiter.construct(
  () => ({
    func: function (callback) {
      // type-error since callback will be a string
      callback(Math.random());
    },
  }),
  {
    eval: false,
  }
);

// if options.methods[methodName].eval is defined, 
// it will overwrite the global config
arbeiter.construct(
  () => ({
    func: function (callback) {
      // no type-error
      callback(Math.random());
    },
  }),
  {
    eval: false,
    methods: {
      func: {
        eval: true,
      },
    },
  }
);
```

```ts
// If you want to remove the overhead of the arbeiter 
// responding back after each execution
// You can disable this functionality inside 
// the config with the `async`-parameter

// The methods affected will not be cast to a sync function
// but the async functions will never resolve

const { methods } = arbeiter.construct(
  () => ({
    func: function (callback) {
      return "resolved";
    },
  }),
  {
    async: false,
  }
);

methods.func().then(message => 
  console.log(message)
); // console.log() will never be called

// Just as with `eval`, `async` can be configured for individual methods too
const { methods, terminate } = factory.construct(
  () => ({
    func: function (callback) {
      return "resolved";
    },
  }),
  {
    async: false,
    methods: {
      func: {
        async: true,
      },
    },
  }
);

methods.func().then(message => 
  console.log(message)
); // console.log() will be called
```

- terminate workers

```ts
import Factory from "arbeiter";

const arbeiter = new Arbeiter<{}>();

const { methods, terminate } = arbeiter.construct(() => ({}));

// Individual workers can be terminated with terminate()
terminate()

// To terminate all workers constructed with the arbeiter
arbeiter.terminate()
```

# Acknowledgements

I took the idea of making workers dynamically with `.toString` from [worktank](https://github.com/fabiospampinato/worktank). `worktank`'s focus is pooling, pure functions (in dynamic mode) and isomorphic code. `arbeiter` does not have any pooling-functionality currently, allows for state to be initialized/managed, and is currently only available in-browser.
