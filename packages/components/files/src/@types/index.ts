export type FileStep = 'new' | 'download' | 'extract' | 'analyze';

export type FileCurrentStatus = 'in-process' | 'complete' | 'error' | 'fatal' | null;

export type FileTelegramMeta = {
    messageId: number;
    peerId: number;
    peerAccessHash: number;
};

export type FileMeta = {
    fileName: string;
    size: number;
    filePassword: string | null;
    mimeType: string;
    localFilePath: string;
    extractFilePath: string;
};

export type FileEntity = {
    tg: FileTelegramMeta;
    file: FileMeta;
    step: FileStep;
    currentStatus: FileCurrentStatus;
};
