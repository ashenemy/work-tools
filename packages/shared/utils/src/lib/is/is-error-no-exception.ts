import { isError } from './is-error.js';

export function isErrorNoException(value: unknown): value is NodeJS.ErrnoException {
    return isError(value) && 'code' in value && value.code === 'ENOENT';
}