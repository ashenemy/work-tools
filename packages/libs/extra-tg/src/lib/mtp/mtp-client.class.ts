import type { Optional } from '@work-tools/ts';
import { TelegramClient } from 'telegram';
import { expBackoff, isDefined, isString, isUndefined, sleep, withTimeout } from '@work-tools/utils';
import { type MTPClientConfig, type MTPClientSendMessageData, MTPClientStatus } from '../../@types';
import { BehaviorSubject } from 'rxjs';
import { StringSession } from 'telegram/sessions';
import { MTP_CLIENT_CONNECTION_RECONNECT_OPTIONS, MTP_CLIENT_INIT_OPTIONS, MTP_CLIENT_WATCHDOG_CONNECTION_OPTIONS, TG_CHAT_HISTORY_LOOKUP_HISTORY } from './mtp-client.constants';
import { input } from '@inquirer/prompts';
import type { EntityLike } from 'telegram/define';
import { MtpMessage } from './types/mtp-message.class';
import * as messageMethods from 'telegram/client/messages';
import { MtpClientActionBuilder } from './inc/mtp-client-action-builder.class';

export class MtpClient {
    private _currentStatus: MTPClientStatus = 'stopped';
    private _session: Optional<StringSession> = undefined;
    private readonly _statusUpdate$: BehaviorSubject<MTPClientStatus> = new BehaviorSubject<MTPClientStatus>(this._currentStatus);
    private _watchdogTimer: Optional<NodeJS.Timeout> = undefined;
    private _reconnectingTimer: Optional<NodeJS.Timeout> = undefined;
    private readonly _chatsWatcher: Map<EntityLike, MtpClientActionBuilder> = new Map();

    public constructor() {
        this._statusUpdate$.subscribe((status) => {
            this._currentStatus = status;

            if (status === 'error') {
                void this._reconnecting();
            } else if (status === 'stopped') {
                void this._dispose();
            } else if (status === 'connected') {
                if (isUndefined(this._watchdogTimer)) {
                    void this._startWatchdog();
                }
            }
        });
    }

    private _client: Optional<TelegramClient>;

    public get client(): TelegramClient {
        if (isUndefined(this._client)) {
            throw new Error('Client is not inited');
        }

        return this._client;
    }

    private _clientConnectionConfig: Optional<MTPClientConfig> = undefined;

    private get clientConnectionConfig(): MTPClientConfig {
        if (isUndefined(this._clientConnectionConfig)) {
            throw new Error('Client is not inited');
        }

        return this._clientConnectionConfig;
    }

    public init(connectionConfig: MTPClientConfig): void {
        this._session = new StringSession(connectionConfig.session ?? '');
        this._client = new TelegramClient(this._session, connectionConfig.apiId, connectionConfig.apiHash, MTP_CLIENT_INIT_OPTIONS);
    }

    public async start(): Promise<Optional<string>> {
        const userIsAuthorized = await this.client.checkAuthorization();

        if (!userIsAuthorized) {
            await this._signIn();
        }

        this._statusUpdate$.next('connected');

        void this._startWatchdog();

        return this._session?.save();
    }

    public startWatchingChat(chat: EntityLike): MtpClientActionBuilder {
        if (this._chatsWatcher.has(chat)) {
            return this._chatsWatcher.get(chat)!;
        }

        const newWatcher: MtpClientActionBuilder = new MtpClientActionBuilder(chat, this);
        this._chatsWatcher.set(chat, newWatcher);

        return newWatcher;
    }

    public stop(): void {
        this._statusUpdate$.next('stopped');
    }

    public async sendMessage(to: EntityLike, message: string | MTPClientSendMessageData): Promise<number> {
        return (await this.client.sendMessage(to, isString(message) ? { message: message } : message)).id;
    }

    public async sendBotCommand(bot: string, command: string, arg?: string): Promise<number> {
        return await this.sendMessage(bot, `${command}${arg ? ` ${arg}` : ''}`);
    }

    public async sendBotStartCommand(bot: string, arg?: string): Promise<number> {
        return await this.sendBotCommand(bot, 'start', arg);
    }

    public async getEntityHistory(peer: EntityLike): Promise<Array<MtpMessage>>;
    public async getEntityHistory(peer: EntityLike, messageIds: number): Promise<Optional<MtpMessage>>;
    public async getEntityHistory(peer: EntityLike, messageIds?: number): Promise<Array<MtpMessage> | Optional<MtpMessage>> {
        const q: Partial<messageMethods.IterMessagesParams> = {};
        let oneResult = false;
        if (isDefined(messageIds)) {
            q.ids = messageIds;
            q.limit = 1;
            oneResult = true;
        } else {
            q.reverse = true;
            q.limit = TG_CHAT_HISTORY_LOOKUP_HISTORY.limit;
            q.waitTime = TG_CHAT_HISTORY_LOOKUP_HISTORY.nextPageWaitTime;
        }

        const resultMessages: MtpMessage[] = [];

        for await (const m of this.client.iterMessages(peer, q)) {
            if (oneResult) {
                return new MtpMessage(m);
            } else {
                resultMessages.push(new MtpMessage(m));
            }
        }

        if (oneResult) {
            return undefined;
        }

        return resultMessages;
    }

    private async _reconnecting(): Promise<void> {
        if (this._currentStatus === 'stopped' || this._currentStatus === 'reconnecting' || isDefined(this._reconnectingTimer)) {
            return;
        }

        this._statusUpdate$.next('reconnecting');

        let reconnectAttempts = 0;

        this._reconnectingTimer = setInterval(async () => {
            try {
                await this._reconnectingAttempt(reconnectAttempts);
                reconnectAttempts = 0;
                clearInterval(this._reconnectingTimer);
                this._statusUpdate$.next('connected');
            } catch (e) {
                reconnectAttempts += 1;
            }
        }, MTP_CLIENT_CONNECTION_RECONNECT_OPTIONS.retryDelayMs);

        this._reconnectingTimer?.unref();
    }

    private async _reconnectingAttempt(attempt: number): Promise<void> {
        if (this._currentStatus === 'stopped' || this._currentStatus === 'reconnecting' || attempt > MTP_CLIENT_CONNECTION_RECONNECT_OPTIONS.maxAttempts) {
            return;
        }

        try {
            await withTimeout(this.client.connect(), MTP_CLIENT_CONNECTION_RECONNECT_OPTIONS.connectTimeoutMs, 'connect timeout');
            await withTimeout(this.client.getMe(), MTP_CLIENT_CONNECTION_RECONNECT_OPTIONS.healthCheckTimeoutMs, 'healthcheck timeout');
            return;
        } catch (e) {
            const delay = expBackoff(attempt, MTP_CLIENT_CONNECTION_RECONNECT_OPTIONS.retryDelayMs, MTP_CLIENT_CONNECTION_RECONNECT_OPTIONS.backoffMaxMs);
            await sleep(delay);
        }
    }

    private async _signIn(): Promise<void> {
        await this.client.signInUser(
            {
                apiId: this.clientConnectionConfig.apiId,
                apiHash: this.clientConnectionConfig.apiHash,
            },
            {
                phoneNumber: this.clientConnectionConfig.phoneNumber,
                password: async () => Promise.resolve(this.clientConnectionConfig.password),
                phoneCode: async () => input({ message: 'Enter code' }),
                onError: (err) => console.log(err),
            },
        );
    }

    private async _startWatchdog(): Promise<void> {
        if (isDefined(this._watchdogTimer)) {
            return;
        }

        this._watchdogTimer = setInterval(() => {
            if (this._currentStatus === 'stopped' || this._currentStatus === 'reconnecting') {
                return;
            }

            if (this.client.disconnected || !this.client.connected) {
                this._statusUpdate$.next('error');
            }
        }, MTP_CLIENT_WATCHDOG_CONNECTION_OPTIONS.watchdogTimeoutMs);

        this._watchdogTimer.unref();
    }

    private async _dispose(): Promise<void> {
        if (isDefined(this._watchdogTimer)) {
            clearInterval(this._watchdogTimer);
            this._watchdogTimer = undefined;
        }

        if (isDefined(this._reconnectingTimer)) {
            clearInterval(this._reconnectingTimer);
            this._reconnectingTimer = undefined;
        }

        await this.client.disconnect();
    }
}
