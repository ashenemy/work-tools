import { Bot, Context, InlineKeyboard } from 'grammy';
import type { FileFlavor } from '@grammyjs/files';
import type { BotApiClientConfig, BotApiEvent, BotApiNewLogFlowPayload, BotApiTopicTarget } from '../../@types';
import type { Optional } from '@work-tools/ts';
import { humanNumber, isDefined, isUndefined } from '@work-tools/utils';
import { type Observable, Subject } from 'rxjs';
import { BOT_API_ICONS } from './messages/bot-api-icons';
import { BotApiTextBuilder } from './messages/builders/bot-api-text-builder.class';

export class BotApiClient {
    public commands: Array<string> = [];
    private _connectionConfig: Optional<BotApiClientConfig> = undefined;
    private _listenersSet = false;

    public _client: Optional<Bot<FileFlavor<Context>>> = undefined;

    public get client(): Bot<FileFlavor<Context>> {
        if (isUndefined(this._client)) {
            throw new Error('Client is not inited');
        }

        return this._client;
    }

    private _commands$: Subject<BotApiEvent> = new Subject();

    public get commands$(): Observable<BotApiEvent> {
        return this._commands$.asObservable();
    }

    public get botName(): string {
        if (isUndefined(this._connectionConfig)) {
            throw new Error('Client is not inited');
        }

        return this._connectionConfig.botName;
    }

    public init(connectionConfig: BotApiClientConfig): void {
        this._connectionConfig = connectionConfig;

        this._client = new Bot(connectionConfig.botToken);
        this._listenersSet = false;
    }

    public async start(): Promise<void> {
        if (!this._listenersSet) {
            this._setListeners();
            this._listenersSet = true;
        }
        await this.client.start();
    }

    public async stop(): Promise<void> {
        await this.client.stop();
    }

    public async sendMessage(chat: string, text: Array<string>): Promise<number> {
        return (
            await this.client.api.sendMessage(chat, text.join('\n'), {
                parse_mode: 'HTML',
            })
        ).message_id;
    }

    public async sendNewLogMessage(target: BotApiTopicTarget, p: BotApiNewLogFlowPayload): Promise<number> {
        const titleHtml = `${BOT_API_ICONS.warn} <b>New Log</b> ${p.flagIcon}`;

        const msg = new BotApiTextBuilder(4)
            .raw(titleHtml)
            .section('✅ Found', (b) => b.checks(p.checkboxItems))
            .hr(18)
            .section(`${BOT_API_ICONS.domains} Domains`, (b) => b.domainsList(p.domains))
            .hr(18)
            .section('📌 Meta', (b) => {
                b.kv(BOT_API_ICONS.date, 'Date', p.dateText);
                b.kv(BOT_API_ICONS.total, 'All', humanNumber(p.allCount));
                b.kv(BOT_API_ICONS.mac, 'Is mac', p.isMac ? 'Yes' : 'No');
            })
            .build();

        const kb = new InlineKeyboard().url('▶️ Download', this.makeStartUrl(p.fileName));

        const sent = await this.client.api.sendMessage(target.chatId, msg.text, {
            parse_mode: msg.parse_mode,
            reply_markup: kb,
            ...(typeof target.threadId === 'number' ? { message_thread_id: target.threadId } : {}),
        });

        return sent.message_id;
    }

    public async deleteMessage(chat: string, messageId: number): Promise<void> {
        await this.client.api.deleteMessage(chat, messageId);
    }

    private _setListeners(): void {
        for (const command of this.commands) {
            this.client.command(command, (ctx) => {
                this._commands$.next({ name: command, ctx });
            });
        }

        this.client.on('message', (ctx) => {
            if (isUndefined(ctx.message)) {
                return;
            }

            if (ctx.message.text?.startsWith('/')) {
                return;
            }

            if (isDefined(ctx.message.document)) {
                this._commands$.next({ name: 'file', ctx });
            } else {
                this._commands$.next({ name: 'text', ctx });
            }
        });
    }

    private makeStartUrl(fileId: string): string {
        return `https://t.me/${this.botName}?start=${encodeURIComponent(fileId)}`;
    }
}
