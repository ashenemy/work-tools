import { join } from 'path';
import type { Optional } from '@work-tools/ts';
import { isDefined } from '@work-tools/utils';
import { Dirent } from 'node:fs';
import { BaseArchiveFile } from './archive/base-archive-file.class';
import { ArchiveFileTypeError } from '../errors/file-type/archive-file-type.error';
import { Folder } from '../primitives/folder.class';
import { File } from '../primitives/file.class';

export class ArchiveFile extends BaseArchiveFile {
    protected _possiblePasswords: Array<Optional<string>> = [];

    constructor(filePath: string | Dirent) {
        super(filePath);

        if (!ArchiveFile.isArchiveFile(filePath)) {
            throw new ArchiveFileTypeError(this.name);
        }
    }

    protected _password: Optional<string> = undefined;

    public get password(): Optional<string> {
        return this._password;
    }

    public set password(value: Optional<string>) {
        this._password = value;

        if (this._possiblePasswords.length === 0) {
            this._possiblePasswords.push(undefined);

            if (isDefined(value) && !value.startsWith('@')) {
                this._possiblePasswords.push(`@${value}`);
            }

            this._possiblePasswords.push('@LOGACTIVE');
        }
    }

    public get extractPath(): Folder {
        return new Folder(join(this.parent, this.baseName ?? this.fileName));
    }

    public static isArchiveFile(filePath: string | Dirent): boolean {
        if (!File.isFile(filePath)) {
            return false;
        }

        const parsedResult = BaseArchiveFile.analyzeArchiveFilename(filePath);

        return parsedResult.isArchive;
    }

    public setNextPassword(): Optional<boolean> {
        if (this._possiblePasswords.length === 0) {
            return undefined;
        }

        this._password = this._possiblePasswords.shift();
        return true;
    }
}
