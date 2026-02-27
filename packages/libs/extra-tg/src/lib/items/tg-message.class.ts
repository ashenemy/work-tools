import { Api } from 'telegram';
import { EntityLike } from 'telegram/define';
import { Optional } from '@work-tools/ts';
import { isDefined, isNull, isType, isUndefined } from '@work-tools/utils';
import { UrlBotData } from '../../@types';
import { TgMessageFile } from './tg-message-file.class';
import { MtpClient } from '../connections/mtp-client.class';

export class TgMessage {
    public messageFile: Optional<TgMessageFile> = undefined;

    constructor(private readonly _message: Api.Message) {
        if (isDefined(this.document)) {
            this.messageFile = TgMessageFile.fromMessageDoc(this);
        }
    }

    public get haveDocument(): boolean {
        return isDefined(this.document);
    }

    public get media(): Optional<Api.MessageMediaDocument> {
        return isDefined(this._message.media) && isType(this._message.media, Api.MessageMediaDocument) ? this._message.media : undefined;
    }

    public get document(): Optional<Api.Document> {
        return isDefined(this.media) && isType(this.media.document, Api.Document) ? this.media.document : undefined;
    }

    public get haveDownloadBotButton(): boolean {
        return isDefined(this.keyboardBotStartButton);
    }

    public get messageId(): number {
        return this._message.id;
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

    public static fromMessage(message: Api.Message): TgMessage {
        return new TgMessage(message);
    }

    public static fromForward(resp: Optional<Api.Message[][] | Api.Message[]>): TgMessage {
        if (isUndefined(resp)) {
            throw new Error('No message found in response');
        }

        const message: Optional<Api.Message> = resp.flat().at(0);

        if (isUndefined(message)) {
            throw new Error('No message found in response');
        }

        return new TgMessage(message);
    }

    public static async runBotCommand(commandData: UrlBotData): Promise<void> {
        await MtpClient.tgClient.sendMessage(`@${commandData.botName}`, {
            message: `/start ${commandData.startArg}`,
        });
    }

    public async forwardTo(chat: EntityLike = 'me'): Promise<Optional<Api.Message[]>> {
        return await this._message.forwardTo(chat);
    }

    public async forwardToMe(): Promise<Optional<Api.Message[]>> {
        return await this.forwardTo('me');
    }

    public async remove(): Promise<void> {
        await this._message.delete();
    }

    public async reply(text: string): Promise<void> {
        await this._message.reply({
            message: text,
            replyTo: this._message,
        });
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
