export function isoToFlagEmoji(iso2: string): string {
    const code = String(iso2 ?? '')
        .trim()
        .toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) return '🏳️';

    const A = 0x1f1e6;
    const base = 'A'.codePointAt(0)!;
    const c1 = code.codePointAt(0)! - base;
    const c2 = code.codePointAt(1)! - base;

    return String.fromCodePoint(A + c1, A + c2);
}
