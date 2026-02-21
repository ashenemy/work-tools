
export type AuthEvent = { status: 'code_required' } | { status: 'password_required' } | { status: 'authorized' } | { status: 'error'; error: unknown };

export type WatchMessagesOptions = {
    incomingOnly?: boolean;
    outgoingOnly?: boolean;
};

export type TelegramChatIdentifier = string | number;

export type DownloadFileOptions = {
    workers?: number;
    progressCallback?: (progress: number) => void;
};

