import { Dirent } from 'node:fs';
import { emptydir, ensureDir, mkdir, readdir, statSync } from 'fs-extra';
import { File } from './file.class';
import { isType } from '@work-tools/utils';
import { FileTree, FsItem } from '../../@types';
import fg from 'fast-glob';
import { Options } from 'fast-glob/out/settings';
import { FsFactory } from '../fs-factory.class';
import { AbstractFs } from '../abstracts/abstract-fs.class';
import { Optional } from '@work-tools/ts';

export class Folder extends AbstractFs {
    public static isFolder(path: string | Dirent): boolean {
        if (isType(path, Dirent)) {
            return path.isDirectory();
        }

        try {
            const lstat = statSync(path);

            return lstat.isDirectory();
        } catch {
            return false;
        }
    }

    public override async ensure(): Promise<void> {
        await ensureDir(this.absPath);
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

    public async find(pattern: string, opt: Options = {}): Promise<Array<FsItem>> {
        const findOptions: Options = {
            absolute: true,
            braceExpansion: true,
            caseSensitiveMatch: false,
            cwd: this.absPath,
            dot: true,
            extglob: true,
            globstar: true,
            onlyFiles: true,
            unique: true,
            objectMode: false,
            ...opt,
        };

        return (await fg(pattern, findOptions)).map((item) => FsFactory.fromPath(item));
    }
}
