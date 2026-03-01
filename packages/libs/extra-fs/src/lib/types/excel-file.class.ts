import { ExcelSheet } from '../../@types';
import xlsx from 'node-xlsx';
import { Dirent } from 'node:fs';
import { File } from '../primitives/file.class';
import { ExcelFileTypeError } from '../errors/file-type/excel-file-type.error';
import { AbstractTextFile } from '../abstracts/abstract-text-file.class';

export class ExcelFile<T extends ExcelSheet = Array<Array<any>>> extends AbstractTextFile<T> {
    public static readonly EXTENSIONS: Array<string> = ['xlsx', 'xls'];

    constructor(filePath: string | Dirent) {
        super(filePath);

        if (ExcelFile.isExcelFile(filePath)) {
            throw new ExcelFileTypeError(this.name);
        }
    }

    public static isExcelFile(filePath: string | Dirent): boolean {
        if (!File.isFile(filePath)) {
            return false;
        }

        const _file: File = new File(filePath);
        return ExcelFile.EXTENSIONS.includes(_file.ext);
    }

    protected override _parse(content: string): Promise<T> {
        return new Promise((resolve, reject) => {
            resolve(
                xlsx
                    .parse(content)
                    .map((list) => list.data)
                    .flat() as unknown as T,
            );
        });
    }
}
