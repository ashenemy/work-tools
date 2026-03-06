import { Api } from 'telegram';
import { Optional } from '@work-tools/ts';
import { isDefined, isNull, isTwoDArrayType, isType, isUndefined } from '@work-tools/utils';
import { UrlBotData } from '../../../@types';
import { MtpClient } from '../mtp-client.class';
import { NewMessageEvent } from 'telegram/events';
import type { EntityLike } from 'telegram/define';
import { MtpMessageFile } from './mtp-message-file.class';

export class MtpMessage {
    constructor(private readonly _message: Api.Message) {}

    public get media(): Optional<Api.MessageMediaDocument> {
        return isDefined(this._message.media) && isType(this._message.media, Api.MessageMediaDocument) ? this._message.media : undefined;
    }

    public get document(): Optional<Api.Document> {
        return isDefined(this.media) && isType(this.media.document, Api.Document) ? this.media.document : undefined;
    }

    public get downloadableFile(): Optional<MtpMessageFile> {
        if (isUndefined(this.media)) {
            return undefined;
        }

        return new MtpMessageFile(this);
    }

    public get messageId(): number {
        return this._message.id;
    }

    public get peerId(): Api.TypePeer {
        return this._message.peerId;
    }

    public get messageText(): string {
        return this._message.text;
    }

    public get keyboardUrlButtons(): Array<Api.KeyboardButtonUrl> {
        const keyboardButtons: Api.KeyboardButtonUrl[] = [];

        if (this._message.replyMarkup?.className === 'ReplyInlineMarkup') {
            const markup = this._message.replyMarkup as Api.ReplyInlineMarkup;

            const keyboardButtonRows: Api.KeyboardButtonRow[] = markup.rows.filter((row) => row.className === 'KeyboardButtonRow');

            for (const keyboardButtonRow of keyboardButtonRows) {
                keyboardButtons.push(...keyboardButtonRow.buttons.filter((item) => item.className === 'KeyboardButtonUrl'));
            }
        }

        return keyboardButtons;
    }

    public get keyboardBotStartButton(): Optional<UrlBotData> {
        const keyboardButtons: Api.KeyboardButtonUrl[] = this.keyboardUrlButtons;

        for (const keyboardButton of keyboardButtons) {
            const botData: Optional<UrlBotData> = this._getBotDataFromUrl(keyboardButton.url);

            if (isDefined(botData)) {
                return botData;
            }
        }

        return undefined;
    }

    public static fromMessage(message: Api.Message): MtpMessage {
        return new MtpMessage(message);
    }

    public static fromEvent(event: NewMessageEvent): MtpMessage {
        return new MtpMessage(event.message);
    }

    public static fromForward(resp: Optional<Api.Message[] | Api.Message[][]>): Optional<MtpMessage> {
        if (isUndefined(resp)) {
            throw new Error('No message found in response');
        }

        const _normalizeResp: Array<Api.Message> = isTwoDArrayType(resp) ? resp.flat() : resp;

        const message: Optional<Api.Message> = _normalizeResp.at(0);

        if (isUndefined(message)) {
            throw new Error('No message found in response');
        }

        return new MtpMessage(message);
    }

    public static async fromId(peer: EntityLike, messageIds: number, client: MtpClient): Promise<Optional<MtpMessage>> {
        return await client.getEntityHistory(peer, messageIds);
    }

    public static async getChatHistory(peer: EntityLike, client: MtpClient): Promise<Array<MtpMessage>> {
        return await client.getEntityHistory(peer);
    }

    public async forwardTo(chat: EntityLike): Promise<Optional<MtpMessage>> {
        return MtpMessage.fromForward(await this._message.forwardTo(chat));
    }

    public async getInputPeerAccessHash(): Promise<Optional<number>> {
        const input = await this._message.getInputChat();

        if (isDefined(input) && isType(input, Api.InputPeerChannel)) {
            return input.accessHash.toJSNumber();
        }

        return undefined;
    }

    private _getBotDataFromUrl(url: string): Optional<UrlBotData> {
        const re = /^https?:\/\/t\.me\/([A-Za-z0-9_]{5,32})(?:\?start=([^&#]+))?$/;
        const m = url.match(re);

        if (!isNull(m) && isDefined(m[1]) && isDefined(m[2])) {
            return {
                botName: m[1],
                startArg: m[2],
            };
        }

        return undefined;
    }
}
