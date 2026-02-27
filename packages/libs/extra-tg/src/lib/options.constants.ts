import { ExtraTgOptions } from '../@types';

export const EXTRA_TG_OPTIONS: ExtraTgOptions = {
    download: {
        requestSize: 1024 * 1024,
        maxAttempts: 10,
    },
    history: {
        limit: 10,
        nextPageWaitTime: 10000,
        nextMessageRunWaitTime: 2000,
    },
    clientConnection: {
        watchdogMs: 15000,
        connectTimeoutMs: 20000,
        healthcheckTimeoutMs: 10000,
        maxManualReconnectAttempts: Number.POSITIVE_INFINITY,
        backoffMaxMs: 30000,
        retryDelayMs: 1000,
    },
    invoke: {
        attempts: 3,
        retryBaseDelayMs: 400,
        retryMaxDelayMs: 5000,
    },
    mtpClient: {
        autoReconnect: true,
        connectionRetries: 5,
        retryDelay: 1000,
        useWSS: false,
        maxConcurrentDownloads: 2,
        floodSleepThreshold: 300,
        requestRetries: 10,
        downloadRetries: 10,
    },
};
