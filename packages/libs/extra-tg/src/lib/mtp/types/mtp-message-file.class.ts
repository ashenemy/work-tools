import type { Optional } from '@work-tools/ts';
import { isType, isUndefined } from '@work-tools/utils';
import { extension } from 'mime-types';
import { Api } from 'telegram';
import type { MTPMessageFileInfo } from '../../../@types';
import type { MtpMessage } from './mtp-message.class';

import TypeMessageMedia = Api.TypeMessageMedia;

export class MtpMessageFile {
    private readonly _document: Api.Document;

    constructor(private readonly _message: MtpMessage) {
        if (isUndefined(_message.document)) {
            throw new Error('No document found in message');
        }

        this._document = _message.document;
    }

    public get fileName(): string {
        const attr = this._document.attributes?.find((a) => isType(a, Api.DocumentAttributeFilename));

        return attr?.fileName ?? this.fileNameByType;
    }

    public get size(): number {
        return this._document.size.toJSNumber();
    }

    public get fileNameByType(): string {
        let ext = extension(this._document.mimeType);
        if (!ext) {
            ext = 'tmp';
        }

        return `${this._message.messageId}.${ext}`;
    }

    public get filePassword(): Optional<string> {
        const regex = /\.pass[:\s]+([^\n\r]+)/i;

        const match = this._message.messageText.match(regex);
        return match ? match[1].trim() : undefined;
    }

    public get downloadable(): TypeMessageMedia {
        if (isUndefined(this._message.media)) {
            throw new Error('No document found in message');
        }
        return this._message.media;
    }

    public async getInfo(): Promise<MTPMessageFileInfo> {
        return {
            fileName: this.fileName,
            filePassword: this.filePassword,
            messageId: this._message.messageId,
            mimeType: this._document.mimeType,
            peerAccessHash: await this._message.getInputPeerAccessHash(),
            peerId: this._message.peerId,
            size: this.size,
        };
    }
}
