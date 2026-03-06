export function pad(num: number, width: number): string {
    const s = String(num);
    return s.length >= width ? s : '0'.repeat(width - s.length) + s;
}
