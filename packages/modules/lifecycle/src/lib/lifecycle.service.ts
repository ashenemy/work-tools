import { INestApplicationContext, Injectable } from '@nestjs/common';
import { ChildProcessMeta } from '../@type';
import { AbstractLifecycleService } from './abstract-lifecycle.service';

@Injectable()
export class WorkerDownloadLifecycle extends AbstractLifecycleService {
    constructor(
        private readonly processRegistry: ProcessRegistryService,
        private readonly ipcClient: IpcClientService,
        private readonly worker: DownloadWorkerService,
    ) {
        super();
    }

    public async onProcessBootstrap(meta: ChildProcessMeta, _app: INestApplicationContext): Promise<void> {
        await this.processRegistry.register(meta);
        await this.ipcClient.connect(meta);
    }

    public async onProcessStart(meta: ChildProcessMeta): Promise<void> {
        await this.ipcClient.emit('process.started', meta);
        await this.worker.start();
    }

    public async onProcessStop(reason: string, meta: ChildProcessMeta): Promise<void> {
        await this.worker.stop();
        await this.ipcClient.emit('process.stopping', { ...meta, reason });
        await this.processRegistry.markStopped(meta.instanceId, reason);
    }

    public async onProcessError(error: unknown, meta: ChildProcessMeta): Promise<void> {
        await this.processRegistry.markFailed(meta.instanceId, error);
        await this.ipcClient.emit('process.failed', {
            instanceId: meta.instanceId,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}
