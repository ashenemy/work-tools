import { JsonLike } from '@work-tools/ts';
import { AbstractWritableFile } from '../abstracts';
import { Dirent } from 'node:fs';
import { File } from '../primitives';
import { JsonFileTypeError } from '../errors';

export class JsonFile<T extends JsonLike = {}> extends AbstractWritableFile<T> {
    public static readonly EXTENSIONS: Array<string> = ['json'];

    constructor(filePath: string | Dirent) {
        super(filePath);

        if (!JsonFile.isJsonFile(filePath)) {
            throw new JsonFileTypeError(this.name);
        }
    }

    public static isJsonFile(filePath: string | Dirent): boolean {
        if (!File.isFile(filePath)) {
            return false;
        }

        const _file: File = new File(filePath);
        return JsonFile.EXTENSIONS.includes(_file.ext);
    }

    protected override _stringify(data: T): Promise<string> {
        return Promise.resolve(JSON.stringify(data, null, 4));
    }

    protected override _parse(content: string): Promise<T> {
        return Promise.resolve(JSON.parse(content) as T);
    }
}
