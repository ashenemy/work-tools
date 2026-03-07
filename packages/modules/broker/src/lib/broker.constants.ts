export const BROKER_NATS_OPTIONS = Symbol('BROKER_NATS_OPTIONS');
export const BROKER_DEFAULT_REQUEST_TIMEOUT_MS = Symbol('BROKER_DEFAULT_REQUEST_TIMEOUT_MS');
export const BROKER_CLIENT = Symbol('BROKER_CLIENT');

export const BROKER_MESSAGE_PATTERNS = {
    emit: 'broker.emit',
    request: 'broker.request',
    ping: 'broker.ping',
} as const;
