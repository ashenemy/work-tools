import type { TruncateResult } from '../../../../@types';

export function truncateWithEllipsis(input: string, limit: number): TruncateResult {
    const s = String(input ?? '');
    const n = Math.max(0, Math.floor(limit));

    if (n === 0) return { truncated: s.length > 0, value: s.length ? '…' : '' };
    if (s.length <= n) return { truncated: false, value: s };

    const cut = Math.max(0, n - 1);
    const chunk = s.slice(0, cut).trimEnd();
    return { truncated: true, value: chunk + '…' };
}
