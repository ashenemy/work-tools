import { isType } from './is-type.js';

export function isError(value: unknown): value is Error {
    return isType(value, Error);
}
