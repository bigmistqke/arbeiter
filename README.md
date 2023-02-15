# Arbeiter

A worker-helper for in-browser.
Allows for state to be managed

# How to use

```ts
import Arbeiter from "arbeiter";

const arbeiter = new Arbeiter(() => ({
  counter: 0,
  increment: function () {
    // only variables accessed with `this` can be manipulated
    return this.counter++;
  },
}));

// all functions are converted into async functions (through postMessage)
// and are accessible in `arbeiter.methods`
arbeiter.methods.increment().then(
  value => value // 1
);
```

```ts
import Arbeiter from "arbeiter";

const arbeiter = new Arbeiter<{
  canvas?: OffscreenCanvas,
  context?:
  transfer: (canvas: OffscreenCanvas) => void
  fill: (color: string) => void
}>(() => ({
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
arbeiter.methods.transfer(canvas.transferControlToOffscreen()).then(
  () => arbeiter.methods.fill("red")
)
```

# Acknowledgements

I took the idea of making workers dynamically with `.toString` from [worktank](https://github.com/fabiospampinato/worktank). `worktank`'s focus is pooling, pure functions (in dynamic mode) and isomorphic code. `arbeiter` does not have any pooling-functionality currently, allows for state to be initialized/managed, and is currently only available in-browser.
