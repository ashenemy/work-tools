import { createFile, ensureFile, readFile } from 'fs-extra';
import { Dirent } from 'node:fs';
import { isDefined, isType } from '@work-tools/utils';
import mime from 'mime-types';
import type { Optional } from '@work-tools/ts';
import { basename, extname } from 'path';
import { AbstractFs } from '../abstracts/abstract-fs.class';

export class File<ContentType extends Buffer | string = Buffer> extends AbstractFs {
    public static isFile(path: string | Dirent): boolean {
        if (isType(path, Dirent)) {
            return path.isFile();
        }

        if (path.endsWith('/') || path.endsWith('\\')) {
            return false;
        }


        const ext = extname(path).toLowerCase();
        const baseName = basename(path);

        if (baseName === '.env' || ext.length > 1) {
            return true;
        }

        return false;
    }

    public get extension(): string {
        return extname(this.absPath).toLowerCase();
    }

    public get ext(): string {
        return this.extension.substring(1);
    }

    public get fileName(): string {
        if (this.ext === '') {
            return this.name;
        }
        const names = this.name.split('.');
        names.pop();
        return names.join('.');
    }

    public get mime(): Optional<string> {
        return mime.lookup(this.absPath) || undefined;
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

    public override async isEmpty(): Promise<Optional<boolean>> {
        const size = await this.size();
        if (isDefined(size)) {
            return size === 0;
        }

        return undefined;
    }

    public async read(): Promise<ContentType> {
        return (await readFile(this.absPath)) as ContentType;
    }
}
