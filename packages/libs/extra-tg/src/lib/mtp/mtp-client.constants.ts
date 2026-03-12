import type { TelegramClientParams } from 'telegram/client/telegramBaseClient';
import type { MTPChatHistoryOptions, MTPClientConnectionWatchdog, MTPClientReconnectionOptions, MTPDownloadOptions } from '../../@types';

export const MTP_CLIENT_INIT_OPTIONS: TelegramClientParams = {
    autoReconnect: true,
    connectionRetries: 5,
    downloadRetries: 10,
    floodSleepThreshold: 300,
    maxConcurrentDownloads: 2,
    requestRetries: 10,
    retryDelay: 1000,
    useWSS: false,
};

export const MTP_CLIENT_WATCHDOG_CONNECTION_OPTIONS: MTPClientConnectionWatchdog = { watchdogTimeoutMs: 15000 };

export const MTP_CLIENT_CONNECTION_RECONNECT_OPTIONS: MTPClientReconnectionOptions = {
    backoffMaxMs: 30000,
    connectTimeoutMs: 20000,
    healthCheckTimeoutMs: 10000,
    maxAttempts: Number.POSITIVE_INFINITY,
    retryDelayMs: 1000,
};

export const TG_CHAT_HISTORY_LOOKUP_HISTORY: MTPChatHistoryOptions = { limit: 5, nextMessageRunWaitTime: 3000, nextPageWaitTime: 10000 };

export const TG_FILE_DOWNLOAD_OPTIONS: MTPDownloadOptions = { maxAttempts: 10, requestSize: 1024 * 1024 };
