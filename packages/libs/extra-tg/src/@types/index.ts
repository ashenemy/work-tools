import { TelegramClient } from 'telegram';
import { TgMessage } from '../lib/items/tg-message.class';
import { EntityLike } from 'telegram/define';
import { Optional } from '@work-tools/ts';
import { TgMessageFile } from '../lib/items/tg-message-file.class';

export type MTPClientConfig = {
    apiId: number;
    apiHash: string;
    session?: string;
    userPhoneNumber: string;
    userPassword: string;
}

export type TgClientStatus = 'connected' | 'stopped';

export type TgInvokeOptions = {
    attempts: number;
    retryBaseDelayMs: number;
    retryMaxDelayMs: number;
}

export type InvokeFn<T> = (client: TelegramClient) => Promise<T>;

export type TgClientConnectionsOptions = {
    watchdogMs: number;
    connectTimeoutMs: number;
    healthcheckTimeoutMs: number;
    maxManualReconnectAttempts: number;
    backoffMaxMs: number;
    retryDelayMs: number;
};

export type TgChatOptions = {
    newMessageWatching: boolean;
    autoSaveForMe: boolean;
    downloadHistory: boolean;
    autoTouchButton: boolean;
    autoDownloadDocument: boolean
}

export type TgChatEventType = 'new_message' | 'save_message' | 'download_file';

export type TgChatEvent = {
    type: 'new_message' | 'save_message';
    message: TgMessage;
    chat: Optional<EntityLike>;
} | {
    type: 'download_file';
    file: TgMessageFile;
};

export type UrlBotData = {
    botName: string;
    startArg: string;
};

export type ProgressEvent = {
    total: number;
    success: number;
};