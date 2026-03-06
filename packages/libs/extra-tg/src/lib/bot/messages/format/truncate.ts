import type { TruncateResult } from '../../../../@types';

export function truncateWithEllipsis(input: string, limit: number): TruncateResult {
    const s = String(input ?? '');
    const n = Math.max(0, Math.floor(limit));

    if (n === 0) return { value: s.length ? '…' : '', truncated: s.length > 0 };
    if (s.length <= n) return { value: s, truncated: false };

    const cut = Math.max(0, n - 1);
    const chunk = s.slice(0, cut).trimEnd();
    return { value: chunk + '…', truncated: true };
}
