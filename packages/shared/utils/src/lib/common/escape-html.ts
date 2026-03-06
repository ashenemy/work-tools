import { toString } from '../to/to-string.js';

export function escapeHtml(input: unknown): string {
    return (toString(input) ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
