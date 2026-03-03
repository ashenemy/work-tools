import { Dirent } from 'node:fs';
import { emptydir, ensureDir, ensureDirSync, mkdir, readdir, statSync } from 'fs-extra';
import { File } from './file.class';
import { isErrorNoException, isType } from '@work-tools/utils';
import type { FileTree } from '../../@types';
import fg, { Options } from 'fast-glob';
import { AbstractFs } from '../abstracts/abstract-fs.class';
import type { Optional } from '@work-tools/ts';
import _7z from '7zip-min';
import { dirname, extname, join, resolve } from 'path';

export class Folder extends AbstractFs {
    public static isFolder(path: string | Dirent, canBeCreate: boolean = false): boolean {
        if (isType(path, Dirent)) {
            return path.isDirectory();
        }

        try {
            const lstat = statSync(path);

            return lstat.isDirectory();
        } catch (err) {
            return isErrorNoException(err) && canBeCreate;
        }
    }

    public override async ensure(): Promise<void> {
        await ensureDir(this.absPath);
    }

    public override ensureSync(): void {
        ensureDirSync(this.absPath);
    }

    public override async create(): Promise<void> {
        await mkdir(this.absPath, { recursive: true });
    }

    public override async size(): Promise<Optional<number>> {
        const allNodes = (await this.listFiles()).map((item) => new File(item));

        let size = 0;
        for (const node of allNodes) {
            size += (await node.size()) ?? 0;
        }

        return size;
    }

    public override async empty(): Promise<void> {
        await emptydir(this.absPath);
    }

    public override async isEmpty(): Promise<boolean> {
        return (await this.getChilds()).length === 0;
    }

    public async getChilds(): Promise<Array<Dirent>> {
        const nodes = await readdir(this.absPath, { withFileTypes: true });

        return nodes.filter((node) => node.isDirectory() || node.isFile());
    }

    public async getFiles(): Promise<Array<Dirent>> {
        const nodes = await this.getChilds();

        return nodes.filter((item) => item.isFile());
    }

    public async getFolders(): Promise<Array<Dirent>> {
        const nodes = await this.getChilds();

        return nodes.filter((item) => item.isDirectory());
    }

    public async listFiles(): Promise<Array<Dirent>> {
        const nodes = await readdir(this.absPath, { withFileTypes: true, recursive: true });

        return nodes.filter((item) => item.isFile());
    }

    public async filesTree(): Promise<FileTree> {
        const files = (await this.getChilds()).map((item) => (item.isFile() ? new File(item) : new Folder(item)));
        const tree: FileTree = {};

        for (const file of files) {
            if (isType(file, Folder)) {
                tree[file.name] = await file.filesTree();
            } else {
                tree[file.name] = null;
            }
        }

        return tree;
    }

    public async find(pattern: string, opt: Options = {}): Promise<Array<string>> {
        const findOptions: Options = {
            absolute: true,
            braceExpansion: true,
            caseSensitiveMatch: false,
            cwd: this.absPath,
            dot: true,
            extglob: true,
            globstar: true,
            unique: true,
            objectMode: false,
            onlyFiles: false,
            onlyDirectories: false,
            ...opt,
        };

        return await fg(pattern, findOptions);
    }

    public async zip(destination?: string): Promise<string> {
        const zipPath = this._resolveZipPath(destination);
        const sourcePattern = join(this.absPath, '*');

        await ensureDir(dirname(zipPath));
        await _7z.cmd(['a', zipPath, sourcePattern]);

        return zipPath;
    }

    protected _resolveZipPath(destination?: string): string {
        if (!destination) {
            return resolve(this.parent, `${this.name}.zip`);
        }

        const archivePath = resolve(destination);
        const ext = extname(archivePath).toLowerCase();

        if (ext === '.zip') {
            return archivePath;
        }

        if (ext === '') {
            return `${archivePath}.zip`;
        }

        throw new Error(`Zip destination must have .zip extension or no extension. Destination: ${destination}`);
    }
}
