import { Dirent } from 'node:fs';
import { FsFolder } from './fs-folder.class';
import { extname, resolve } from 'path';
import { FsTextFile } from './fs-text-file.class';
import { FsArchiveFile } from './fs-archive-file.class';
import { FsFile } from './fs-file.class';
import { stat } from 'fs-extra';
import { isType } from '@work-tools/utils';

export class FileFactory {
    public static async from(input: string | Dirent): Promise<FsFolder | FsTextFile | FsArchiveFile | FsFile> {
        const p = isType(input, Dirent) ? resolve(input.parentPath, input.name) : resolve(input);
        const fsStat = await stat(p);

        if (fsStat.isDirectory()) {
            return new FsFolder(p);
        }

        if (FileFactory.isTextFile(p)) {
            return new FsTextFile(p);
        }

        if (FileFactory.isArchiveFile(p)) {
            return new FsArchiveFile(p);
        }

        return new FsFile(p);
    }

    public static isTextFile(p: string): boolean {
        const e = extname(p).toLowerCase();

        return ['.txt', '.md', '.json', '.log', '.csv', '.ts', '.js', '.html', '.css', '.xml', '.yml', '.yaml'].includes(e);
    }

    public static isArchiveFile(p: string): boolean {
        const lower = p.toLowerCase();

        if (/\.(zip|7z|rar|tar|gz|bz2|xz|tgz|tbz|jar|war|ear|iso|dmg)$/i.test(lower)) {
            return true;
        }

        return /\.(z0[1-9]|part[0-9]+|zip\.[0-9]{3}|rar\.[0-9]{3}|[0-9]{3})$/i.test(lower);
    }
}
