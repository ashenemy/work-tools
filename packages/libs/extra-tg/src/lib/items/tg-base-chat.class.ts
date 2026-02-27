import { EntityLike } from 'telegram/define';
import { TgChatEvent, TgChatOptions } from '../../@types';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { TgMessage } from './tg-message.class';
import { Observable, Subject } from 'rxjs';
import { isDefined, isType, sleep } from '@work-tools/utils';
import { MtpClient } from '../connections/mtp-client.class';
import { Api } from 'telegram';

export class TgChat {
    public static CHAT_HISTORY_NEXT_PAGE_WAIT_TIME = 30000;
    public static CHAT_HISTORY_ACTION_WAIT_TIME = 1000;

    protected readonly _options: TgChatOptions;

    protected _updates: Subject<TgChatEvent> = new Subject();

    constructor(
        protected readonly _chat: EntityLike,
        options: Partial<TgChatOptions> = {},
    ) {
        this._options = {
            newMessageWatching: false,
            autoSaveForMe: false,
            downloadHistory: false,
            autoTouchButton: false,
            autoDownloadDocument: false,
            ...options,
        };
    }

    public get updates(): Observable<TgChatEvent> {
        return this._updates.asObservable();
    }

    protected get _newMessageEvent(): NewMessage {
        return new NewMessage({
            chats: [this._chat],
            incoming: true,
        });
    }

    protected _init(): void {
        if (this._options.newMessageWatching) {
            this._startNewMessageWatching();
        }

        if (this._options.downloadHistory) {
            this._downloadChatHistory();
        }
    }

    protected _startNewMessageWatching(): void {
        if (!this._options.newMessageWatching) {
            return;
        }

        MtpClient.tgClient.addEventHandler(this._onNewMessage, this._newMessageEvent);
    }

    protected async _downloadChatHistory(): Promise<void> {
        if (!this._options.downloadHistory) {
            return;
        }
        const entity = await MtpClient.tgClient.getInputEntity(this._chat);

        for await (const m of MtpClient.tgClient.iterMessages(entity, {
            limit: undefined,
            reverse: true,
            waitTime: TgChat.CHAT_HISTORY_NEXT_PAGE_WAIT_TIME,
        })) {
            await this._onNewMessage(m);
            await sleep(TgChat.CHAT_HISTORY_ACTION_WAIT_TIME);
        }
    }

    protected async _onNewMessage(event: NewMessageEvent | Api.Message): Promise<void> {
        const message = TgMessage.fromMessage(isType(event, NewMessageEvent) ? event.message : event);

        this._updates.next({ type: 'new_message', message, chat: this._chat });

        if (this._options.autoTouchButton && message.haveDownloadBotButton) {
            const messageBotData = message.keyboardBotStartButton;

            if (isDefined(messageBotData)) {
                await TgMessage.runBotCommand(messageBotData);
            }
        }

        if (this._options.autoDownloadDocument && isDefined(message.messageFile)) {
            this._updates.next({ type: 'download_file', file: message.messageFile });
        }

        if (this._options.autoSaveForMe) {
            try {
                const savedMessage: TgMessage = TgMessage.fromForward(await message.forwardToMe());
                this._updates.next({ type: 'save_message', message: savedMessage, chat: 'me' });
            } catch (e) {
                console.error('AutoSaveForMe failed', e);
            }
        }
    }
}