import { Optional } from './optional.type.js';

export type OptionalStrict<Strict extends boolean, T> = Strict extends true ? T : Optional<T>;
