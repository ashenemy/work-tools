export type Ctor<T, A extends Array<any>> = new (...args: A) => T;
