export function isType(value: unknown, expected: 'string'): value is string;
export function isType(value: unknown, expected: 'number'): value is number;
export function isType(value: unknown, expected: 'bigint'): value is bigint;
export function isType(value: unknown, expected: 'boolean'): value is boolean;
export function isType(value: unknown, expected: 'symbol'): value is symbol;
export function isType(value: unknown, expected: 'undefined'): value is undefined;
export function isType(value: unknown, expected: 'function'): value is Function;
export function isType(value: unknown, expected: 'object'): value is object | null;
export function isType<T>(value: unknown, expected: 'array'): value is T[];
export function isType<T extends Record<string, unknown>>(value: unknown, expected: 'object'): value is T;
export function isType(value: unknown, expected: null): value is null;
export function isType<T>(value: unknown, expected: abstract new (...args: any[]) => T): value is T;
export function isType(value: unknown, expected: string | null | (abstract new (...args: any[]) => unknown)): boolean {
    if (expected === null) {
        return value === null;
    }

    if (typeof expected === 'string') {
        return typeof value === expected;
    }

    return value instanceof expected;
}
