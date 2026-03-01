import { basename, isAbsolute } from 'node:path';

export function getFileName(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) {
        throw new Error('getFilename: empty input');
    }

    if (!isAbsolute(trimmed) && !trimmed.includes('/') && !trimmed.includes('\\')) {
        return trimmed;
    }

    return basename(trimmed)
}