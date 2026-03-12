import type { Dirent } from 'node:fs';
import type { JsonLike } from '@work-tools/ts';
import { AbstractWritableFile } from '../abstracts/abstract-writable-file.class';
import { JsonFileTypeError } from '../errors/file-type/json-file-type.error';
import { File } from '../primitives/file.class';

export class JsonFile<T extends JsonLike = {}> extends AbstractWritableFile<T> {
    public static readonly EXTENSIONS: Array<string> = ['json'];

    constructor(filePath: string | Dirent, createNewFile: boolean = false) {
        super(filePath);

        if (!JsonFile.isJsonFile(filePath, createNewFile)) {
            throw new JsonFileTypeError(this.name);
        }
    }

    public static isJsonFile(filePath: string | Dirent, createNewFile: boolean = false): boolean {
        if (!File.isFile(filePath, createNewFile)) {
            return false;
        }

        const _file: File = new File(filePath, createNewFile);
        return JsonFile.EXTENSIONS.includes(_file.ext);
    }

    protected override _stringify(data: T): Promise<string> {
        return Promise.resolve(JSON.stringify(data, null, 4));
    }

    protected override _parse(content: string): Promise<T> {
        return Promise.resolve(JSON.parse(content) as T);
    }

    protected override assertDestinationCompatible(destination: string): void {
        this.assertAllowedExtensions(destination, JsonFile.EXTENSIONS);
    }
}
