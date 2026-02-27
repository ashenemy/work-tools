import { TelegramClient } from 'telegram';
import { Optional } from '@work-tools/ts';
import { StringSession } from 'telegram/sessions';
import { InvokeFn, MTPClientConfig, TgClientConnectionsOptions, TgClientStatus, TgInvokeOptions } from '../../@types';
import { LogLevel } from 'telegram/extensions/Logger';
import { expBackoff, isConnectionError, isDefined, isUndefined, sleep, withTimeout } from '@work-tools/utils';
import { input } from '@inquirer/prompts';
import { EnvConfig } from '@work-tools/env-config';
import { EXTRA_TG_OPTIONS } from '../options.constants';

export class MtpClient {
    private _reconnecting: Optional<Promise<void>> = undefined;
    private _watchdogTimer: Optional<NodeJS.Timeout> = undefined;
    private readonly _session: StringSession;
    private _status: TgClientStatus = 'stopped';

    private readonly _invokeOptions: TgInvokeOptions = EXTRA_TG_OPTIONS.invoke;
    private readonly _tgClientConnectionOptions: TgClientConnectionsOptions = EXTRA_TG_OPTIONS.clientConnection;

    constructor(private readonly _clientConfig: MTPClientConfig) {
        this._session = new StringSession(this._clientConfig.session ?? '');

        MtpClient.tgClient = new TelegramClient(this._session, this._clientConfig.apiId, this._clientConfig.apiHash, EXTRA_TG_OPTIONS.mtpClient);

        MtpClient.tgClient.setLogLevel(LogLevel.ERROR);
    }

    private static _appConfig: Optional<EnvConfig> = undefined;

    public static get appConfig(): EnvConfig {
        if (isUndefined(MtpClient._appConfig)) {
            throw new Error('MtpClient.appConfig is not set. Use MtpClient.appConfig = new EnvConfig(...)');
        }

        return MtpClient._appConfig;
    }

    public static set appConfig(config: EnvConfig) {
        MtpClient._appConfig = config;
    }

    private static _tgClient: Optional<TelegramClient> = undefined;

    public static get tgClient(): TelegramClient {
        if (isUndefined(MtpClient._tgClient)) {
            throw new Error('MtpClient.tgClient is not set. Use MtpClient.tgClient = new TelegramClient(...)');
        }

        return MtpClient._tgClient;
    }

    public static set tgClient(client: TelegramClient) {
        MtpClient._tgClient = client;
    }

    public get session(): string {
        return this._session.save();
    }

    public async safeInvoke<T>(fn: InvokeFn<T>): Promise<T> {
        let lastErr: unknown;

        for (let i = 1; i <= this._invokeOptions.attempts; i++) {
            if (this._status === 'stopped') {
                throw new Error('Client is stopped');
            }

            try {
                if (this._reconnecting) {
                    await this._reconnecting;
                }

                const isDisconnected = MtpClient.tgClient.disconnected;
                const isConnected = MtpClient.tgClient.connected;
                if (isDisconnected || !isConnected) {
                    await this.reconnect();
                }

                return await fn(MtpClient.tgClient);
            } catch (e) {
                lastErr = e;

                if (isConnectionError(e)) {
                    try {
                        await this.reconnect();
                    } catch (re) {
                        lastErr = re;
                    }
                }

                if (i < this._invokeOptions.attempts) {
                    const delay = expBackoff(i, this._invokeOptions.retryBaseDelayMs, this._invokeOptions.retryMaxDelayMs);
                    await sleep(delay);
                }
            }
        }

        throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
    }

    public async start(): Promise<void> {
        await MtpClient.tgClient.connect();

        if (!(await MtpClient.tgClient.checkAuthorization())) {
            await this._authUser();
        }

        this._status = 'connected';

        this._startWatchdog();
    }

    public async stop(): Promise<void> {
        this._status = 'stopped';

        if (isDefined(this._watchdogTimer)) {
            clearInterval(this._watchdogTimer);
            this._watchdogTimer = undefined;
        }

        await MtpClient.tgClient.disconnect();
    }

    public async reconnect(): Promise<void> {
        if (this._status == 'stopped') {
            return;
        }

        if (isDefined(this._reconnecting)) {
            return this._reconnecting;
        }

        this._reconnecting = (async () => {
            let attempt = 0;

            while (this._status === 'connected') {
                attempt += 1;

                try {
                    await withTimeout(MtpClient.tgClient.connect(), this._tgClientConnectionOptions.connectTimeoutMs, 'connect timeout');
                    await withTimeout(MtpClient.tgClient.getMe(), this._tgClientConnectionOptions.healthcheckTimeoutMs, 'healthcheck timeout');
                    return;
                } catch (e) {
                    if (attempt >= this._tgClientConnectionOptions.maxManualReconnectAttempts) throw e;

                    const delay = expBackoff(attempt, this._tgClientConnectionOptions.retryDelayMs, this._tgClientConnectionOptions.backoffMaxMs);
                    console.warn(`[gramjs] reconnect attempt ${attempt} failed, retry in ${delay}ms`, e);
                    await sleep(delay);
                }
            }
        })().finally(() => {
            this._reconnecting = undefined;
        });

        return this._reconnecting;
    }

    private _startWatchdog() {
        if (isDefined(this._watchdogTimer)) {
            return;
        }

        this._watchdogTimer = setInterval(() => {
            if (this._status === 'stopped') {
                return;
            }

            const isDisconnected = MtpClient.tgClient.disconnected;
            const isConnected = MtpClient.tgClient.connected;

            if ((isDisconnected || !isConnected) && isDefined(this._reconnecting)) {
                void this._reconnecting.catch((e) => console.error('[gramjs] watchdog reconnect failed:', e));
            }
        }, this._tgClientConnectionOptions.watchdogMs);

        this._watchdogTimer.unref();
    }

    private async _authUser(): Promise<void> {
        await MtpClient.tgClient.signInUser(
            {
                apiId: this._clientConfig.apiId,
                apiHash: this._clientConfig.apiHash,
            },
            {
                phoneNumber: this._clientConfig.userPhoneNumber,
                password: async () => Promise.resolve(this._clientConfig.userPassword),
                phoneCode: async () => input({ message: 'Enter code' }),
                onError: (err) => console.log(err),
            },
        );
    }
}
