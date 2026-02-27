import { FsFile } from '../base/fs-file.class';
import { basename, dirname, extname, join } from 'path';
import { existsSync } from 'fs-extra';
import { Dirent } from 'node:fs';

export class FsArchiveFile extends FsFile {
    constructor( input: string | Dirent, public password?: string, ) {
        super(input);
    }

    public isMultipart(): boolean {
        const name = this.getName().toLowerCase();
        return /\.(z0[1-9]|part[0-9]+|zip\.[0-9]{3}|rar\.[0-9]{3}|[0-9]{3})$/i.test(name);
    }

    public getAllPartPaths(): string[] {
        const dir = dirname(this._path);
        const baseName = basename(this._path, extname(this._path)).toLowerCase();
        const parts: string[] = [this._path];

        for (let i = 1; i <= 99; i++) {
            const p = join(dir, `${baseName}.z${i.toString().padStart(2, '0')}`);
            if (existsSync(p)) parts.push(p);
            else break;
        }

        for (let i = 1; i <= 99; i++) {
            const p = join(dir, `${baseName}.part${i}${extname(this._path)}`);
            if (existsSync(p) && !parts.includes(p)) parts.push(p);
        }

        for (let i = 1; i <= 999; i++) {
            const p = join(dir, `${baseName}.${i.toString().padStart(3, '0')}`);
            if (existsSync(p) && !parts.includes(p)) parts.push(p);
        }

        return parts;
    }

    public async areAllPartsAvailable(): Promise<boolean> {
        if (!this.isMultipart()) return true;
        const parts = this.getAllPartPaths();
        if (parts.length <= 1) return true;

        const numbers = parts
            .map((p) => {
                const m = p.match(/\.z0?(\d+)$/i) || p.match(/\.part(\d+)/i) || p.match(/\.(\d{3})$/);
                return m ? parseInt(m[1], 10) : NaN;
            })
            .filter((n) => !isNaN(n))
            .sort((a, b) => a - b);

        for (let i = 1; i < numbers.length; i++) {
            if (numbers[i] !== numbers[i - 1] + 1) return false;
        }
        return true;
    }
}
