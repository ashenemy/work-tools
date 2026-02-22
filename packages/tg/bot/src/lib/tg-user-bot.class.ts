import { StringSession } from 'telegram/sessions';
import { TelegramClient } from 'telegram';
import { input } from '@inquirer/prompts';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { BaseLogMessage } from '@work-tools/log-message';
import { LogLevel } from 'telegram/extensions/Logger';
import { BOXED_BOT_GROUP_ID, BOXED_GROUP_ID, TasksQueue } from '@work-tools/bot-runner';

export class TgUserBot {
    private static readonly API_ID: number = 31618789;
    private static readonly API_HASH: string = '53dca6f0ca57b1e528d4b8f61e968482';
    private static readonly BOT_PHONE_NUMBER: string = '+37433618001';
    private static readonly BOT_PASSWORD: string = 'Qwerty12as12!';

    private readonly _session: StringSession;
    private _client: TelegramClient; // не readonly — можно пересоздавать
    private reconnectTimer: NodeJS.Timeout | null = null;
    private processedMessages = new Set<number>(); // защита от дублей сообщений

    constructor() {
        this._session = new StringSession('1AgAOMTQ5LjE1NC4xNjcuNTABuwasiYvIduI0fx4815CMUG1UNnLb+mIMpMCU4vur0YMC3CeA/yM+czOsgOY/N+0WKRimt2cv5li4E6gfrYJ+6zYER5UNGnsmD2AJF5MT0AZuQTDXHx3EYqd2TVW7kB7fTjMjumQIyVXv5LADfgSVyg19HzJaidANAT43nh6X1+HpOuHdfHMTFSDWsScW1wRvY3l5DFuT5RHRPHWkmJ6Qh9Qn6ocUi0bCHUHEeLdEPzrAKh+VInj6d7l+7QrtTuSLl4IrPhFuqcabeTnui10WsJYPLZV5E2cQv4rFL/j3AXjBB1H3B4cGTydd+nF/E4UfXwFGkXuu3CohgwYzLuXNJjM=');

        this._client = new TelegramClient(this._session, TgUserBot.API_ID, TgUserBot.API_HASH, {
            connectionRetries: 5,
            baseLogger: undefined,
        });

        this._client.setLogLevel(LogLevel.ERROR);
    }

    public async startWithAutoReconnect(intervalHours = 8) {
        await this.connect();

        this.reconnectTimer = setInterval(
            async () => {
                console.info('Scheduled reconnect...');
                await this.gracefulRestart();
            },
            intervalHours * 60 * 60 * 1000,
        );
    }

    public async connect(): Promise<TelegramClient> {
        try {
            await this._client.start({
                phoneNumber: TgUserBot.BOT_PHONE_NUMBER,
                password: async () => Promise.resolve(TgUserBot.BOT_PASSWORD),
                phoneCode: async () => input({ message: 'Enter code' }),
                onError: (err) => console.log(err),
            });

            this._setupListeners();
            return this._client;
        } catch (error) {
            console.error('TgUserBot connect failed', error);
            throw error;
        }
    }

    private async gracefulRestart() {
        try {
            await this._client.disconnect().catch(() => {});
            await this._client.destroy().catch(() => {});
            this._client.session.save();

            this._client = new TelegramClient(this._session, TgUserBot.API_ID, TgUserBot.API_HASH, {
                connectionRetries: 5,
                baseLogger: undefined,
            });
            this._client.setLogLevel(LogLevel.ERROR);

            await this.connect();
            console.info('Graceful restart completed successfully');
        } catch (e) {
            console.error('Graceful restart failed', e);
        }
    }

    public async shutdown() {
        if (this.reconnectTimer) {
            clearInterval(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        await this._client.disconnect().catch(() => {});
        await this._client.destroy().catch(() => {});
        this.processedMessages.clear();
    }

    public async manualRun(): Promise<void> {
        try {
            const messages = await this._client.getMessages(BOXED_GROUP_ID, { limit: 20});


            for (const item of messages) {
                const message = new BaseLogMessage(item, this._client);
                if (message.isLogMessage) {
                    await message.share();
                }
            }
        } catch (error) {
            console.error('manualRun error', error);
        }
    }

    private _setupListeners(): void {
        this._setupBoxedBotNewMessagesListeners();
        this._setupBoxedGroupNewMessagesListeners();
    }

    private _setupBoxedBotNewMessagesListeners(): void {
        this._client.addEventHandler(
            async (event: NewMessageEvent) => {
                try {
                    await this._handleNewMessageSafe(event);
                } catch (error) {
                    console.error('NewMessageEvent handler crashed', error);
                }
            },
            new NewMessage({ chats: [BOXED_BOT_GROUP_ID], incoming: true }),
        );
    }

    private _setupBoxedGroupNewMessagesListeners(): void {
        this._client.addEventHandler(
            async (event: NewMessageEvent) => {
                try {
                    await this._handleNewMessageSafe(event);
                } catch (error) {
                    console.error('NewMessageEvent handler crashed', error);
                }
            },
            new NewMessage({ chats: [BOXED_GROUP_ID], incoming: true }),
        );
    }

    private async _handleNewMessageSafe(event: NewMessageEvent): Promise<void> {
        try {
            const msgId = event.message?.id;
            if (!msgId || this.processedMessages.has(msgId)) return;
            this.processedMessages.add(msgId);

            const logMessage = new BaseLogMessage(event.message, this._client);
            if (logMessage.haveFile) {
                const clonedMessage = await logMessage.forwardTo(8535977745);
                if (clonedMessage) {
                    TasksQueue.addTask(clonedMessage, this._client);
                }
            }
        } catch (error) {
            console.error('_handleNewMessageSafe error', error);
        }
    }


}
