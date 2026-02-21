import { Optional } from '@work-tools/ts';
import { isString } from '../is/is-string.js';
import { isNumber } from '../is/is-number.js';
import { isBoolean } from '../is/is-boolean.js';

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