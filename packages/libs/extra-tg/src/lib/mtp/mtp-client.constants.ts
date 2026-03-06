import { TelegramClientParams } from 'telegram/client/telegramBaseClient';
import type { MTPChatHistoryOptions, MTPClientConnectionWatchdog, MTPClientReconnectionOptions, MTPDownloadOptions } from '../../@types';

export const MTP_CLIENT_INIT_OPTIONS: TelegramClientParams = {
    autoReconnect: true,
    connectionRetries: 5,
    retryDelay: 1000,
    useWSS: false,
    maxConcurrentDownloads: 2,
    floodSleepThreshold: 300,
    requestRetries: 10,
    downloadRetries: 10,
};

export const MTP_CLIENT_WATCHDOG_CONNECTION_OPTIONS: MTPClientConnectionWatchdog = {
    watchdogTimeoutMs: 15000,
};

export const MTP_CLIENT_CONNECTION_RECONNECT_OPTIONS: MTPClientReconnectionOptions = {
    maxAttempts: Number.POSITIVE_INFINITY,
    backoffMaxMs: 30000,
    retryDelayMs: 1000,
    connectTimeoutMs: 20000,
    healthCheckTimeoutMs: 10000,
};

export const TG_CHAT_HISTORY_LOOKUP_HISTORY: MTPChatHistoryOptions = {
    limit: 5,
    nextPageWaitTime: 10000,
    nextMessageRunWaitTime: 3000,
};

export const TG_FILE_DOWNLOAD_OPTIONS: MTPDownloadOptions = {
    requestSize: 1024 * 1024,
    maxAttempts: 10,
};
