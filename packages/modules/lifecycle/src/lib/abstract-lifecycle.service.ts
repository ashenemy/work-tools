import type { ChildProcessMeta } from '../@type';
import type { INestApplicationContext } from '@nestjs/common';

export abstract class AbstractLifecycleService {
    public abstract onProcessBootstrap?(meta: ChildProcessMeta, app: INestApplicationContext): Promise<void> | void;
    public abstract onProcessStart?(meta: ChildProcessMeta, app: INestApplicationContext): Promise<void> | void;
    public abstract onProcessStop?(reason: string, meta: ChildProcessMeta, app: INestApplicationContext): Promise<void> | void;
    public abstract onProcessError?(error: unknown, meta: ChildProcessMeta, app: INestApplicationContext): Promise<void> | void;
}
