import type { ExcelSheet } from '../../@types';
import xlsx from 'node-xlsx';
import { Dirent } from 'node:fs';
import { File } from '../primitives/file.class';
import { ExcelFileTypeError } from '../errors/file-type/excel-file-type.error';

export class ExcelFile<T extends ExcelSheet = Array<Array<any>>> extends File<any> {
    public static readonly EXTENSIONS: Array<string> = ['xlsx', 'xls'];

    constructor(filePath: string | Dirent, createNewFile: boolean = false) {
        super(filePath);

        if (!ExcelFile.isExcelFile(filePath, createNewFile)) {
            throw new ExcelFileTypeError(this.name);
        }
    }

    public static isExcelFile(filePath: string | Dirent, createNewFile: boolean = false): boolean {
        if (!File.isFile(filePath, createNewFile)) {
            return false;
        }

        const _file: File = new File(filePath, createNewFile);
        return ExcelFile.EXTENSIONS.includes(_file.ext);
    }

    public override async read(): Promise<T> {
        return new Promise(async (resolve, reject) => {
            resolve(
                xlsx
                    .parse(await super.read())
                    .map((list) => list.data)
                    .flat() as unknown as T,
            );
        });
    }

    protected override assertDestinationCompatible(destination: string): void {
        this.assertAllowedExtensions(destination, ExcelFile.EXTENSIONS);
    }
}
