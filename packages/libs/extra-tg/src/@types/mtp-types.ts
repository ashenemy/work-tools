import type { Api } from 'telegram';
import type { Optional } from '@work-tools/ts';
import type { MessageLike } from 'telegram/define';
import type { MtpMessage } from '../lib/mtp/types/mtp-message.class';

export type MTPClientConfig = {
    apiId: number;
    apiHash: string;
    session: string;
    phoneNumber: string;
    password: string;
};

export type MTPClientStatus = 'connected' | 'connecting' | 'stopped' | 'reconnecting' | 'error';

export type MTPClientActionTrigger = 'new-message';

export type MTPClientActionFilter = 'have-document' | 'have-bot-start-link';

export type MTPClientConnectionWatchdog = {
    watchdogTimeoutMs: number;
};

export type MTPClientReconnectionOptions = {
    maxAttempts: number;
    retryDelayMs: number;
    backoffMaxMs: number;
    connectTimeoutMs: number;
    healthCheckTimeoutMs: number;
};

export type MTPClientSendMessageData = {
    message?: MessageLike;
    replyTo?: number;
    file?: Buffer | Array<Buffer>;
};

export type MTPDownloadOptions = {
    requestSize: number;
    maxAttempts: number;
};

export type MTPChatHistoryOptions = {
    limit: number;
    nextPageWaitTime: number;
    nextMessageRunWaitTime: number;
};

export type MTPMessageFileInfo = {
    messageId: number;
    peerId: Api.TypePeer;
    fileName: string;
    size: number;
    filePassword: Optional<string>;
    mimeType: string;
    peerAccessHash: Optional<number>;
};

export type MTPClientActionEvent = {
    trigger: MTPClientActionTrigger;
    message: MtpMessage;
};

export type MTPFileDownloadProgress = {
    downloaded: number;
    total: number;
};
