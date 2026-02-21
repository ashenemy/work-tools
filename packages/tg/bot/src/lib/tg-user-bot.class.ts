import { StringSession } from 'telegram/sessions';
import { TelegramClient } from 'telegram';
import { input } from '@inquirer/prompts';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { BaseLogMessage } from '@work-tools/log-message';
import { LogLevel } from 'telegram/extensions/Logger';
import { BOXED_GROUP_ID, TasksQueue } from '@work-tools/bot-runner';

export class TgUserBot {
    private static readonly API_ID: number = 31618789;
    private static readonly API_HASH: string = '53dca6f0ca57b1e528d4b8f61e968482';
    private static readonly BOT_PHONE_NUMBER: string = '+37433618001';
    private static readonly BOT_PASSWORD: string = 'Qwerty12as12!';

    private readonly _session: StringSession;
    private readonly _client: TelegramClient;
    constructor() {
        this._session = new StringSession('1AgAOMTQ5LjE1NC4xNjcuNTABuwasiYvIduI0fx4815CMUG1UNnLb+mIMpMCU4vur0YMC3CeA/yM+czOsgOY/N+0WKRimt2cv5li4E6gfrYJ+6zYER5UNGnsmD2AJF5MT0AZuQTDXHx3EYqd2TVW7kB7fTjMjumQIyVXv5LADfgSVyg19HzJaidANAT43nh6X1+HpOuHdfHMTFSDWsScW1wRvY3l5DFuT5RHRPHWkmJ6Qh9Qn6ocUi0bCHUHEeLdEPzrAKh+VInj6d7l+7QrtTuSLl4IrPhFuqcabeTnui10WsJYPLZV5E2cQv4rFL/j3AXjBB1H3B4cGTydd+nF/E4UfXwFGkXuu3CohgwYzLuXNJjM=');

        this._client = new TelegramClient(this._session, TgUserBot.API_ID, TgUserBot.API_HASH, {
            connectionRetries: 5,
            baseLogger: undefined,
        });

        this._client.setLogLevel(LogLevel.ERROR);
    }

    public async connect(): Promise<TelegramClient> {
        await this._client.start({
            phoneNumber: TgUserBot.BOT_PHONE_NUMBER,
            password: async () => Promise.resolve(TgUserBot.BOT_PASSWORD),
            phoneCode: async () => input({ message: 'Enter code' }),
            onError: (err) => console.log(err),
        });

        this._setupListeners();

        return this._client;
    }

    public async manualRun(): Promise<void> {
        const messages = await this._client.getMessages(BOXED_GROUP_ID, { limit: 3 });

        for (const item of messages) {
            const message = new BaseLogMessage(item, this._client);
            if (message.isLogMessage) {
                TasksQueue.addTask(message, this._client);
            }
        }
    }

    private _setupListeners(): void {
        this._setupBoxedGroupNewMessagesListeners();
    }

    private _setupBoxedGroupNewMessagesListeners(): void {
        this._client.addEventHandler(
            async (event: NewMessageEvent) => {
                const logMessage: BaseLogMessage = new BaseLogMessage(event.message, this._client);
                if (logMessage.isLogMessage) {
                    TasksQueue.addTask(logMessage, this._client);
                }
            },
            new NewMessage({ chats: [BOXED_GROUP_ID], incoming: true }),
        );
    }
}
