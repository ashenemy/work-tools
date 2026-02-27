import { statSync } from 'node:fs';

export function fileExists(filePath: string): boolean {
    try {
        const st = statSync(filePath);
        return st.isFile();
    } catch {
        return false;
    }
}
