import { Optional } from '@work-tools/ts';
import { isNumber } from '../is/is-number.js';
import { isString } from '../is/is-string.js';

export function toNumber(value: unknown): Optional<number> {
    if (isNumber(value) && Number.isFinite(value)) {
        return value;
    }

    if (isString(value) && value.trim().length > 0) {
        const n = Number(value.trim());
        if (Number.isFinite(n)) {
            return n;
        }
    }

    return undefined;
}