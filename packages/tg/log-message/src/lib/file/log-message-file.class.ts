import { Api } from 'telegram';
import { Optional } from '@work-tools/ts';
import { isUndefined } from '@work-tools/utils';
import { join } from 'path';

export class LogMessageFile {
    private static readonly LOG_FILES_ROOT = 'C:\\Projects\\work-tools\\storage\\logs';

    constructor(private readonly _logMessage: Api.Message) {}

    public get filePassword(): Optional<string> {
        const regex = /\.pass:\s*`([^`]+)`/;

        const match = this._logMessage.message.match(regex);
        return match ? match[1].trim() : undefined;
    }

    public get media(): Optional<Api.TypeMessageMedia> {
        return this._logMessage.media;
    }

    public get fileName(): string {
        if (isUndefined(this._logMessage.document)) {
            throw new Error(`Message have not file`);
        }

        const fileNameAttribute: Optional<Api.DocumentAttributeFilename> = this._logMessage.document.attributes.find((attr) => attr.className === 'DocumentAttributeFilename');

        if (isUndefined(fileNameAttribute)) {
            throw new Error('File must be have name');
        }

        return fileNameAttribute.fileName;
    }

    public get localFilePath(): string {
        return join(LogMessageFile.LOG_FILES_ROOT, this.fileName);
    }

    public get localFile(): ArchiveFile | File {
        return BaseFile.fromPath(this.localFilePath);
    }
}
