import { Task } from '@work-tools/taskqueue';
import type { JsonLike } from '@work-tools/ts';
import type { QueueTaskHandler, QueueTaskHandlerContext, QueueTaskStateRecord } from '../../@types';

type QueueTaskRuntimeContext = { queueName: string; queueType: string };

export class QueueTask<TResult = unknown> extends Task<JsonLike, TResult> {
    constructor(
        record: QueueTaskStateRecord,
        private readonly _handler: QueueTaskHandler<JsonLike, TResult>,
        private readonly _runtimeContext: QueueTaskRuntimeContext,
    ) {
        super(record.payload, { id: record.id, name: record.taskName, progressTotal: record.progress.total, type: record.taskType });

        this.setProgress(record.progress.success, record.progress.total);
    }

    protected override async run(payload: JsonLike, signal: AbortSignal): Promise<TResult> {
        const context: QueueTaskHandlerContext = {
            getProgress: () => this.getProgress(),
            incrementProgress: (value?: number) => {
                this.incrementProgress(value);
            },
            queueName: this._runtimeContext.queueName,
            queueType: this._runtimeContext.queueType,
            setProgress: (success: number, total?: number) => {
                this.setProgress(success, total);
            },
            setProgressTotal: (total: number) => {
                this.setProgressTotal(total);
            },
            signal,
            taskId: this.id,
        };

        return await this._handler(payload, context);
    }
}
