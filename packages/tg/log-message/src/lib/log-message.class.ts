import { Api, TelegramClient } from 'telegram';
import { Optional } from '@work-tools/ts';
import type { EntityLike } from 'telegram/define';
import { isDefined, isUndefined } from '@work-tools/utils';
import { LogMessageFile } from './file/log-message-file.class';

export class BaseLogMessage {
    public static readonly BOT_NAME = '@boxedrobot';
    public static async getMessageFromId(id: Api.TypeInputMessage, client: TelegramClient): Promise<Optional<Api.Message>> {
        const result: Api.messages.Messages = (await client.invoke(
            new Api.messages.GetMessages({
                id: [id],
            }),
        )) as Api.messages.Messages;

        if (result?.messages.length > 0) {
            return result.messages[0] as Api.Message;
        }

        return undefined;
    }

    public messageText: string;
    public logFile: Optional<LogMessageFile> = undefined;

    constructor(
        protected readonly logMessage: Api.Message,
        protected readonly client: TelegramClient,
    ) {
        this.messageText = this.logMessage.text;

        if (this.haveFile) {
            this.logFile = new LogMessageFile(this.logMessage);
        }
    }

    public get message(): Api.Message {
        return this.logMessage;
    }

    public get document(): Optional<Api.Document> {
        return this.logMessage.document;
    }

    public get haveFile(): boolean {
        return isDefined(this.document);
    }

    private get getShareUrl(): Optional<string> {
        if (this.logMessage.replyMarkup?.className === 'ReplyInlineMarkup') {
            const markup = this.logMessage.replyMarkup as Api.ReplyInlineMarkup;

            const keyboardButtonRows = markup.rows.filter((row) => row.className === 'KeyboardButtonRow');

            if (keyboardButtonRows.length > 0) {
                const shareButtonsRow: Api.KeyboardButtonRow = keyboardButtonRows[0];

                const shareUrlButton = shareButtonsRow.buttons.filter((row) => row.className === 'KeyboardButtonUrl');

                if (shareUrlButton.length > 0) {
                    return shareUrlButton[0].url.replace('https://t.me/boxedrobot?start=', '');
                }
            }
        }

        return undefined;
    }

    public get isLogMessage(): boolean {
        return !!this.getShareUrl;
    }

    public async forwardTo(chat: EntityLike): Promise<Optional<BaseLogMessage>> {
        const newMessages: Optional<Api.Message[]> = await this.logMessage.forwardTo(chat);

        if (isDefined(newMessages) && newMessages.length > 0) {
            // @ts-ignore
            const newMessage = newMessages[0][0];
            // const newMessageData = await BaseLogMessage.getMessageFromId(newMessage.id as unknown as Api.TypeInputMessage, this.client);

            if (isDefined(newMessage)) {
                return new BaseLogMessage(newMessage, this.client);
            }
        }

        return undefined;
    }

    public async createReport(err: Error): Promise<void> {
        await this.logMessage.reply({
            message: err.message,
        });
    }

    public async remove(): Promise<void> {
        await this.client.deleteMessages(this.logMessage.chatId, [this.logMessage.id], { revoke: true });
    }

    public async share(): Promise<void> {
        const shareUrl: Optional<string> = this.getShareUrl;

        if (isUndefined(shareUrl)) {
            throw new Error(`Message not have boxed download button`);
        }

        await this.client.sendMessage(BaseLogMessage.BOT_NAME, {
            message: `/start ${shareUrl}`,
        });
    }
}
