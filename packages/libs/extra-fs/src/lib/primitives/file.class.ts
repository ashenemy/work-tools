import { createFile, ensureFile, readFile, statSync } from 'fs-extra';
import { Dirent } from 'node:fs';
import { isType } from '@work-tools/utils';
import mime from 'mime-types';
import { Optional } from '@work-tools/ts';
import { extname } from 'path';
import { AbstractFs } from '../abstracts/abstract-fs.class';

export class File<ContentType extends Buffer | string = Buffer> extends AbstractFs {
    public get extension(): string {
        return extname(this.absPath).toLowerCase();
    }

    public get ext(): string {
        return this.extension.substring(1);
    }

    public get fileName(): string {
        const names = this.name.split('.');
        names.pop();
        return names.join('.');
    }

    public get mime(): Optional<string> {
        return mime.lookup(this.absPath) || undefined;
    }

    public static isFile(path: string | Dirent): boolean {
        if (isType(path, Dirent)) {
            return path.isFile();
        }

        try {
            const lstat = statSync(path);

            return lstat.isFile();
        } catch {
            return false;
        }
    }

    public override async ensure(): Promise<void> {
        await ensureFile(this.absPath);
    }

    public override async create(): Promise<void> {
        await createFile(this.absPath);
    }

    public override async size(): Promise<Optional<number>> {
        try {
            const stats = await this.getStats();

            return stats.size;
        } catch {
            return undefined;
        }
    }

    public override async empty(): Promise<void> {
        await this.remove();
        await this.create();
    }

    public override async isEmpty(): Promise<boolean> {
        return (await this.size()) === 0;
    }

    public async read(): Promise<ContentType> {
        return (await readFile(this.absPath)) as ContentType;
    }
}
