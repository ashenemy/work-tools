export function hr(length = 12): string {
    const n = Math.max(3, Math.min(60, Math.floor(length)));
    return '─'.repeat(n);
}
