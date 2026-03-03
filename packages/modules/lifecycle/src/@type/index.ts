import type { Type } from '@nestjs/common';

export type ChildProcessMeta = {
    name: string;
    instanceId: string;
    pid: number;
    host: string;
    startedAt: Date;
};

export type ChildProcessSettings = {
    name?: string;
    instanceId?: string;
    shutdownTimeoutMs?: number;
    abortOnError?: boolean;
    nestLogs?: boolean;
};

export type ChildProcessBootstrapOptions = {
    module: Type<unknown>;
    settings: ChildProcessSettings;
    loggerToken?: unknown;
    lifecycleToken?: unknown;
};
