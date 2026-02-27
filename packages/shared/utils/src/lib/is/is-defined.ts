import { Optional } from '@work-tools/ts';

export function isDefined<T>(value: Optional<T>): value is T {
    return value !== undefined;
}
