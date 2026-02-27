import { Nillable } from '@work-tools/ts';
import { isNillable } from './is-nillable.js';

export function isNotNillable<T>(value: Nillable<T>): value is T {
    return !isNillable(value);
}
