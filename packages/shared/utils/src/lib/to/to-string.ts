import type { Optional } from '@work-tools/ts';
import { isBoolean } from '../is/is-boolean.js';
import { isNumber } from '../is/is-number.js';
import { isString } from '../is/is-string.js';

export function toString(value: unknown): Optional<string> {
    if (isString(value)) {
        return value;
    }

    if (isNumber(value) && Number.isFinite(value)) {
        return String(value);
    }

    if (isBoolean(value)) {
        return value ? 'true' : 'false';
    }

    return undefined;
}
