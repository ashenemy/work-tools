import { isBoolean } from '../is/is-boolean.js';
import { Optional } from '@work-tools/ts';
import { isNumber } from '../is/is-number.js';
import { isString } from '../is/is-string.js';

export function toBoolean(value: unknown): Optional<boolean> {
    if (isBoolean(value)) {
        return value;
    }

    if (isNumber(value)) {
        if (value === 1) {
            return true;
        }

        if (value === 0) {
            return false;
        }

        return undefined;
    }

    if (isString(value)) {
        const v = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'y', 'on'].includes(v)) return true;
        if (['false', '0', 'no', 'n', 'off'].includes(v)) return false;
    }

    return undefined;
}
