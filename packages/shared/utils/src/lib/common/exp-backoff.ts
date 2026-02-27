export function expBackoff(attempt: number, base: number, max: number): number {
    const raw = base * Math.pow(2, attempt - 1);
    const capped = Math.min(max, raw);
    const jitter = Math.floor(capped * (0.15 * Math.random()));

    return capped + jitter;
}
