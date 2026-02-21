import { isNull } from './is-null.js';
import { isUndefined } from './is-undefined.js';

export function isNillable(value: unknown): value is undefined | null {
    return isUndefined(value) || isNull(value);
}