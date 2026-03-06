export function humanNumber(n: number): string {
    if (!Number.isFinite(n)) return String(n);
    const s = Math.trunc(n).toString();
    const sign = s.startsWith('-') ? '-' : '';
    const digits = sign ? s.slice(1) : s;

    const parts: string[] = [];
    for (let i = digits.length; i > 0; i -= 3) {
        parts.unshift(digits.slice(Math.max(0, i - 3), i));
    }
    return sign + parts.join(' ');
}
