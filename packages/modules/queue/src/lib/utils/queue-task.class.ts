import { Task } from '@work-tools/taskqueue';
import type { JsonLike } from '@work-tools/ts';
import type { QueueTaskHandler, QueueTaskHandlerContext, QueueTaskStateRecord } from '../../@types';

type QueueTaskRuntimeContext = {
    queueName: string;
    queueType: string;
};

export class QueueTask<TResult = unknown> extends Task<JsonLike, TResult> {
    constructor(
        record: QueueTaskStateRecord,
        private readonly _handler: QueueTaskHandler<JsonLike, TResult>,
        private readonly _runtimeContext: QueueTaskRuntimeContext,
    ) {
        super(record.payload, {
            id: record.id,
            type: record.taskType,
            name: record.taskName,
            progressTotal: record.progress.total,
        });

        this.setProgress(record.progress.success, record.progress.total);
    }

    protected override async run(payload: JsonLike, signal: AbortSignal): Promise<TResult> {
        const context: QueueTaskHandlerContext = {
            signal,
            taskId: this.id,
            queueName: this._runtimeContext.queueName,
            queueType: this._runtimeContext.queueType,
            setProgress: (success: number, total?: number) => {
                this.setProgress(success, total);
            },
            setProgressTotal: (total: number) => {
                this.setProgressTotal(total);
            },
            incrementProgress: (value?: number) => {
                this.incrementProgress(value);
            },
            getProgress: () => this.getProgress(),
        };

        return await this._handler(payload, context);
    }
}
