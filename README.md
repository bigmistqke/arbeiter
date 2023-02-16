# Arbeiter

A worker-helper for in-browser.</br>
Allows for dynamically creating workers with manageable state.

# How to use

- simple example

```ts
import ArbeiterFactory from "arbeiter";

// The arbeiters' types have to be explicitly typed inside Arbeiter's generic.
const factory = new ArbeiterFactory<{ 
  counter: number; 
  increment: () => number 
}>();

const arbeiter = factory.construct(() => ({
  counter: 0,
  increment: function () {
    // only state accessed with `this` can be manipulated
    return this.counter++;
  },
}));

// All functions are converted into async functions
// and are accessible in `methods`
arbeiter.methods.increment().then(
  value => value // 1
);
```

- transfer `OffscreenCanvas`

```ts
import ArbeiterFactory from "arbeiter";

const factory = new ArbeiterFactory<{
  canvas?: OffscreenCanvas,
  context?:
  transfer: (canvas: OffscreenCanvas) => void
  fill: (color: string) => void
}>();

const arbeiter = factory.construct(() => ({
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
arbeiter.methods.transfer(canvas.transferControlToOffscreen()).then(
  () => methods.fill("red")
)
```

- function-parameters

```ts
import ArbeiterFactory from "arbeiter";

const factory = new ArbeiterFactory<{
  func: (callback: (number: number) => void) => void;
}>();

const arbeiter = factory.construct(() => ({
  func: function (callback) {
    callback(Math.random());
  },
}));

// All functions passed as arguments have to be serializable 
// Variables available on `this` can be accessed and manipulated
arbeiter.methods.func(number => 
  console.log("random number", number)
); // worker will log `random number 0.1522...`
arbeiter.methods.func(number => 
  console.log("number random", number)
); // worker will log `number random 0.1522...`

// Functions can normally not be serialized with workers
// To be able to pass and execute the function
// Arbeiter uses `.toString` and `eval` under the hood 

// `eval` has performance and security implications, so be careful.
```

- options-config: `eval`

You can disable passing around and `eval`ing functions with an optional secondary parameter.

```ts
const arbeiter = factory.construct(
  () => ({
    func: function (callback) {
      // will give type-error, since callback will be a string
      callback(Math.random());
    },
  }),
  {
    eval: false,
  }
);
```

If options.methods[methodName].eval is defined, it will overwrite the global config.

```ts
const arbeiter = factory.construct(
  () => ({
    func: function (callback) {
      // will give type-error, since callback will be a string
      callback(Math.random());
    },
  }),
  {
    eval: true,
    methods: {
      func: {
        eval: false,
      },
    },
  }
);
```

- options-config: `resolve`


There is a bit of overhead in the worker responding after each execution.</br>
These responses can be disabled in the config with the `resolve`-parameter.</br>

```ts

const arbeiter = factory.construct(
  () => ({
    func: function (callback) {
      return "resolved";
    },
  }),
  {
    resolve: false,
  }
);
arbeiter.methods.func().then(message => 
  console.log(message)
); // console.log() will never be called
```

Just as with `eval`, `resolve` can be configured for individual methods too.

```ts
const arbeiter = factory.construct(
  () => ({
    func: function (callback) {
      return "resolved";
    },
  }),
  {
    resolve: false,
    methods: {
      func: {
        resolve: true,
      },
    },
  }
);

arbeiter.methods.func().then(message => 
  console.log(message)
); // console.log() will be called
```

- terminate workers

```ts
import ArbeiterFactory from "arbeiter";

const factory = new ArbeiterFactory<{}>();

const arbeiter = factory.construct(() => ({}));

// Individual arbeiters can be terminated with terminate()
arbeiter.terminate()

// To terminate all arbeiters constructed with the factory
factory.terminate()
```

# Acknowledgements

I took the idea of making workers dynamically with `.toString` from [worktank](https://github.com/fabiospampinato/worktank). `worktank`'s focus is pooling, pure functions (in dynamic mode) and isomorphic code. `arbeiter` does not have any pooling-functionality currently, allows for state to be initialized/managed, and is currently only available in-browser.
