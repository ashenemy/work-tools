import { TgMessage } from './tg-message.class';
import { Optional } from '@work-tools/ts';
import { isDefined, isType, isUndefined } from '@work-tools/utils';
import { Api } from 'telegram';
import { MtpClient } from '../connections/mtp-client.class';
import { join } from 'node:path';
import { extension } from 'mime-types';
import { TgMessageFileDownloader } from './tg-message-file-downloader.class';

export class TgMessageFile {
    public static fromMessageDoc(message: TgMessage): Optional<TgMessageFile> {
        if (isDefined(message.document)) {
            return new TgMessageFile(message);
        }

        return undefined;
    }

    public document: Api.Document;
    public media: Api.MessageMediaDocument;
    constructor(private readonly _message: TgMessage) {
        if (isUndefined(_message.document) || isUndefined(_message.media)) {
            throw new Error('No document found in message');
        }

        this.document = _message.document;
        this.media = _message.media;
    }

    public get fileName(): string {
        const attr = this.document.attributes?.find((a) => isType(a, Api.DocumentAttributeFilename));

        return attr?.fileName ?? this.fileNameByType;
    }

    public get saveToPath(): string {
        return join(MtpClient.appConfig.getStringOrThrow('DOWNLOAD_FOLDER'), this.fileName);
    }

    public get size(): number {
        return this.document.size.toJSNumber();
    }

    public get fileNameByType(): string {
        return `${this._message.messageId}.${extension(this.document.mimeType) ?? 'tmp'}`;
    }

    public get filePassword(): Optional<string> {
        const regex = /\.pass[:\s]+([^\n\r]+)/i;

        const match = this._message.messageText.match(regex);
        return match ? match[1].trim() : undefined;
    }

    public get fileDownloader(): TgMessageFileDownloader {
        return new TgMessageFileDownloader(this);
    }
}