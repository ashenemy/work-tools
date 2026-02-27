import { isError } from './is-error.js';

export function isConnectionError<T extends Error>(value: unknown): value is T {
    if (isError(value)) {
        const msg = String(value.message ?? value ?? '');

        return /disconnected/i.test(msg) || /not connected/i.test(msg) || (/connection/i.test(msg) && /closed|lost|reset|broken/i.test(msg)) || /Cannot send requests while disconnected/i.test(msg);
    }

    return false;
}
