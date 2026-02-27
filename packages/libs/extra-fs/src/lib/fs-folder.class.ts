import { AbstractBaseFsItem } from './abstract-base-fs-item.class';
import { emptyDir, copy, ensureDir, readdir, remove } from 'fs-extra';
import { FilterCb, ScanResult } from '../@types';
import {join} from 'path'
import { FsFile } from './fs-file.class';
import { FileFactory } from './fs-file-factory.class';
import { isType } from '@work-tools/utils';

export class FsFolder extends AbstractBaseFsItem {
    public async ensureExists(): Promise<FsFolder> {
        await ensureDir(this._path);
        return this;
    }

    public async list(): Promise<string[]> {
        return readdir(this._path);
    }

    public async getChildren(opts: { recursive?: boolean; filter?: FilterCb<FsFolder | FsFile> } = {}): Promise<(FsFolder | FsFile)[]> {
        const result: (FsFolder | FsFile)[] = [];
        const entries = await readdir(this._path, { withFileTypes: true });
        for (const entry of entries) {
            const full = join(this._path, entry.name);
            const item: FsFolder | FsFile = entry.isDirectory() ? new FsFolder(full) : await FileFactory.from(full);
            if (!opts.filter || opts.filter(item)) result.push(item);
            if (opts.recursive && entry.isDirectory()) {
                result.push(...(await (item as FsFolder).getChildren(opts)));
            }
        }
        return result;
    }

    public async getFiles(recursive = false, filter?: FilterCb<FsFile>): Promise<FsFile[]> {
        const items = await this.getChildren({ recursive });
        return items.filter((i): i is FsFile => isType(i, FsFile) && (!filter || filter(i)));
    }

    public async getFolders(recursive = false): Promise<FsFolder[]> {
        const items = await this.getChildren({ recursive });
        return items.filter((i): i is FsFolder => isType(i, FsFolder));
    }

    public async scan(opts: { recursive?: boolean } = {}): Promise<ScanResult> {
        const items = await this.getChildren({ recursive: opts.recursive });
        return {
            files: items.filter((i) => isType(i, FsFile)).length,
            folders: items.filter((i) => isType(i, FsFolder)).length,
            totalSize: await this.getTotalSize(opts.recursive),
            items,
        };
    }

    public async walk(callback: (item: AbstractBaseFsItem, depth: number) => void | Promise<void>): Promise<void> {
        const children = await this.getChildren({ recursive: true });
        for (const child of children) await callback(child, 0);
    }

    public async findFilesByExtension(ext: string | string[], recursive = true): Promise<FsFile[]> {
        const exts = Array.isArray(ext) ? ext.map((e) => e.toLowerCase()) : [ext.toLowerCase()];
        return this.getFiles(recursive, (f) => exts.includes(f.getExtension()));
    }

    public async getTotalSize(recursive = false): Promise<number> {
        if (!recursive) return this.size();
        const files = await this.getFiles(true);
        let sum = 0;
        for (const f of files) sum += await f.size();
        return sum;
    }

    public async empty(): Promise<void> {
        await emptyDir(this._path);
    }
    public async deleteRecursive(): Promise<void> {
        await remove(this._path);
    }

    public async copyRecursive(dest: string, overwrite = false): Promise<FsFolder> {
        await copy(this._path, dest, { overwrite });
        return new FsFolder(dest);
    }

    public getFolderName(): string {
        return this.getName();
    }
}
