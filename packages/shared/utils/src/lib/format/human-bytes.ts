export function humanBytes(bytes: number, fractionDigits = 1): string {
    if (!Number.isFinite(bytes)) return String(bytes);
    const sign = bytes < 0 ? '-' : '';
    let b = Math.abs(bytes);

    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;
    let u = 0;

    while (b >= 1024 && u < units.length - 1) {
        b /= 1024;
        u += 1;
    }

    const digits = u === 0 ? 0 : Math.max(0, Math.min(3, Math.floor(fractionDigits)));
    const value = b.toFixed(digits);
    const cleaned = digits ? value.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1') : value;

    return `${sign}${cleaned} ${units[u]}`;
}
