import { basename, dirname } from 'path';
import { statSync, unlinkSync, existsSync } from 'node:fs';

export class File {
    public static fileExists(filePath: string): boolean {
        return existsSync(filePath);
    }

    constructor(public readonly fullPath: string) {}

    public get fileName(): string {
        return basename(this.fullPath);
    }

    public get dirName(): string {
        return dirname(this.fullPath);
    }

    public get exists(): boolean {
        return File.fileExists(this.fullPath);
    }

    public get size(): bigint {
        if (!this.exists) {
            throw new Error(`File not found`);
        }

        try {
            const stats = statSync(this.fullPath);

            return BigInt(stats.size);

        } catch {
            throw new Error(`File not found`);
        }
    }

    public remove(): void {
        unlinkSync(this.fullPath);
    }
}