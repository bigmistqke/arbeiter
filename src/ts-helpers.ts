/**
 *  FilterArray
 *  FilterArray filters the values of an array (generic 1) according to a type (generic 2)
 */
export type FilterArray<T extends readonly any[], V> = T extends readonly [
  infer L,
  ...infer R
]
  ? L extends V
    ? [L, ...FilterArray<R, V>]
    : [...FilterArray<R, V>]
  : [];

/**
 *  FilterObject
 *  FilterObject filters the entries of an object (generic 1) according to a type (generic 2)
 *  FilterObject can invert the selection (generic 3)
 */
type PickKeysByValueType<T, TYPE, INVERT extends boolean> = INVERT extends true
  ? {
      [K in keyof T]: T[K] extends TYPE ? never : K;
    }[keyof T]
  : {
      [K in keyof T]: T[K] extends TYPE ? K : never;
    }[keyof T];

export type FilterObject<T, TYPE, INVERT extends boolean = false> = Pick<
  T,
  PickKeysByValueType<T, TYPE, INVERT>
>;

/**
 *  Normalize
 *  Normalize type by recursively applying any type aliases and merging explicit intersections.
 *  Normalize resolves all complex types into simple, readable types
 */
export type Normalize<T> = T extends (...args: infer A) => infer R
  ? (...args: Normalize<A>) => Normalize<R>
  : { [K in keyof T]: Normalize<T[K]> };

export type Func = (...args: unknown[]) => unknown;
