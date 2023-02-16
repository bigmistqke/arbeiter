// Options

import { FilterObject, Normalize } from "./ts-helpers";

export type Config<State> = {
  eval?: boolean;
  async?: boolean;
  methods?: Normalize<
    MapObject<
      FilterObjectForFunction<State>,
      { async?: boolean; eval?: boolean }
    >
  >;
};

type MapObject<Obj extends Record<string, unknown>, Value> = {
  [Key in keyof Obj]?: Value;
};

export type FilterObjectForFunction<T> = FilterObject<T, Function>;

// Methods

//  function-arguments are serialized and `eval`ed
//  this is configurable in the Options-config (hence the type-complexity)
//  - Options.methods[functionName].eval === false
//      -> function-arguments are not serialized and `eval`ed by arbeiter
//      -> function-arguments are typed as string in the method-callback
//  - Options.methods[functionName].eval === true
//      -> function-arguments are serialized and `eval`ed by arbeiter
//      -> function-arguments are typed as functions in the method-callback
//  - Options.methods[functionName].eval === undefined
//      -> check Options.eval instead

export type StateCallback<
  State,
  OPTIONS extends Partial<Config<State>>
> = () => {
  [K in keyof State]: State[K] extends (...args: any[]) => any
    ? OPTIONS extends undefined
      ? MapIfEval<State, K, State[K], Record<string, never>>
      : MapIfEval<State, K, State[K], OPTIONS>
    : State[K];
};

type MapIfEval<
  State,
  K extends keyof State,
  Value extends (...args: any[]) => any,
  OPTIONS extends Partial<Config<State>>
> = ShouldEval<State, K, OPTIONS> extends true
  ? TransformFunction<Value>
  : Value;

type ShouldEval<
  State,
  K extends keyof State,
  OPTIONS extends Partial<Config<State>>
> = K extends keyof OPTIONS["methods"]
  ? OPTIONS["methods"][K] extends { eval: boolean }
    ? OPTIONS["methods"][K]["eval"] extends false
      ? true
      : false
    : false
  : OPTIONS["eval"] extends false
  ? true
  : false;

type TransformFunction<Value extends (...args: any[]) => any> = (
  ...args: TransformFunctionParameters<Parameters<Value>>
) => ReturnType<Value>;

type TransformFunctionParameters<T extends readonly unknown[]> =
  T extends readonly [infer L, ...infer R]
    ? [FunctionTypeToString<L>, ...TransformFunctionParameters<R>]
    : [];

type FunctionTypeToString<T> = T extends (...args: any[]) => any ? string : T;

// Promisify: typecast all functions to Promises
// TODO:  should probably use Func instead of any
//        but FilterObjectForFunction<State> does not return the correct type

export type Promisify<T extends Record<string, any>> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>>;
};
