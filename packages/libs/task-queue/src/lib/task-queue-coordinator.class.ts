import type { Optional } from '@work-tools/ts';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { PersistedTaskDescriptor, QueueTypeProgress, RestoreTasksResult, TaskQueueOptions, TaskQueueProgressEvent, TaskQueueRegistryEvent, TaskQueueStats } from '../@types';
import { Task } from './task.class';
import { TaskQueue } from './task-queue.class';

export class TaskQueueCoordinator {
    private readonly _queues: Map<string, TaskQueue> = new Map();
    private readonly _queueStatsSubscriptions: Map<string, Subscription> = new Map();

    private readonly _progressByTypesSubject: BehaviorSubject<Record<string, QueueTypeProgress>> = new BehaviorSubject<Record<string, QueueTypeProgress>>({});
    public readonly progressByTypes$: Observable<Record<string, QueueTypeProgress>> = this._progressByTypesSubject.asObservable();

    private readonly _registryEventsSubject: Subject<TaskQueueRegistryEvent> = new Subject<TaskQueueRegistryEvent>();
    public readonly registryEvents$: Observable<TaskQueueRegistryEvent> = this._registryEventsSubject.asObservable();

    private readonly _queueProgressSubject: Subject<TaskQueueProgressEvent> = new Subject<TaskQueueProgressEvent>();
    public readonly queueProgress$: Observable<TaskQueueProgressEvent> = this._queueProgressSubject.asObservable();

    public addQueue(name: string, opts: TaskQueueOptions): TaskQueue {
        if (this._queues.has(name)) {
            throw new Error(`Queue "${name}" already exists.`);
        }

        const queue = new TaskQueue(name, opts);
        this._queues.set(name, queue);
        this._bindQueue(queue);
        this._emitTypeProgress(queue.type);
        this._emitRegistryEvent({
            type: 'created',
            queueName: name,
        });
        return queue;
    }

    public createQueue(name: string, opts: TaskQueueOptions): TaskQueue {
        return this.addQueue(name, opts);
    }

    public createOrGetQueue(name: string, opts: TaskQueueOptions): TaskQueue {
        return this.getQueue(name) ?? this.addQueue(name, opts);
    }

    public getQueue(name: string): Optional<TaskQueue> {
        return this._queues.get(name);
    }

    public listQueues(): TaskQueue[] {
        return Array.from(this._queues.values());
    }

    public listQueueNames(): string[] {
        return Array.from(this._queues.keys());
    }

    public listQueuesByType(type: string): TaskQueue[] {
        return this.listQueues().filter((queue) => queue.type === type);
    }

    public observeQueueProgress(name: string): Optional<Observable<TaskQueueStats>> {
        return this.getQueue(name)?.stats$;
    }

    public setQueueConcurrency(name: string, value: number): boolean {
        const queue = this.getQueue(name);
        if (!queue) {
            return false;
        }

        queue.setConcurrency(value);
        return true;
    }

    public enqueue<TPayload, TResult>(queueName: string, task: Task<TPayload, TResult>): Promise<TResult> {
        const queue = this.getQueue(queueName);
        if (!queue) {
            throw new Error(`Queue "${queueName}" not found.`);
        }

        return queue.enqueue(task);
    }

    public async restoreSavedTasks<TRecord>(records: Iterable<TRecord> | AsyncIterable<TRecord>, mapper: (record: TRecord) => PersistedTaskDescriptor | Promise<PersistedTaskDescriptor>): Promise<RestoreTasksResult<TRecord>> {
        const errors: Array<{ record: TRecord; error: unknown }> = [];
        let total = 0;
        let enqueued = 0;

        for await (const record of this._iterateRecords(records)) {
            total += 1;

            try {
                const descriptor = await mapper(record);
                const queueOptions: TaskQueueOptions = descriptor.queueOptions ?? { concurrency: 1 };
                const queue = this.createOrGetQueue(descriptor.queueName, queueOptions);

                if (descriptor.queueOptions) {
                    queue.setConcurrency(descriptor.queueOptions.concurrency);
                }

                if (!queue.canAcceptTasks()) {
                    throw new Error(`Queue "${descriptor.queueName}" cannot accept tasks.`);
                }

                const executionPromise = queue.enqueue(descriptor.task);
                void executionPromise.catch(() => undefined);
                enqueued += 1;
            } catch (error: unknown) {
                errors.push({ record, error });
            }
        }

        return {
            total,
            enqueued,
            failed: errors.length,
            errors,
        };
    }

    public removeQueue(name: string): boolean {
        const queue = this.getQueue(name);
        if (!queue) {
            return false;
        }

        queue.shutdown(new Error(`Queue "${name}" was removed.`));

        const statsSubscription = this._queueStatsSubscriptions.get(name);
        if (statsSubscription) {
            statsSubscription.unsubscribe();
            this._queueStatsSubscriptions.delete(name);
        }

        this._queues.delete(name);
        this._emitTypeProgress(queue.type);
        this._emitRegistryEvent({
            type: 'destroyed',
            queueName: name,
        });
        return true;
    }

    public clearQueues(): void {
        for (const queueName of this.listQueueNames()) {
            this.removeQueue(queueName);
        }

        this._emitRegistryEvent({
            type: 'cleared',
        });
    }

    public getTypeProgress(type: string): Optional<QueueTypeProgress> {
        return this._progressByTypesSubject.value[type];
    }

    public getProgressByTypes(): Record<string, QueueTypeProgress> {
        return {
            ...this._progressByTypesSubject.value,
        };
    }

    private _bindQueue(queue: TaskQueue): void {
        const queueStatsSubscription = queue.stats$.subscribe((stats) => {
            this._queueProgressSubject.next({
                queueName: queue.name,
                queueType: queue.type,
                stats,
            });

            this._emitTypeProgress(queue.type);
        });

        this._queueStatsSubscriptions.set(queue.name, queueStatsSubscription);
    }

    private _emitTypeProgress(type: string): void {
        const sameTypeQueues = this.listQueuesByType(type);
        const currentProgressByType = this.getProgressByTypes();

        if (sameTypeQueues.length === 0) {
            delete currentProgressByType[type];
            this._progressByTypesSubject.next(currentProgressByType);
            return;
        }

        let tasksTotal = 0;
        let tasksSuccess = 0;
        let failed = 0;
        let workTotal = 0;
        let workSuccess = 0;
        let running = 0;
        let pending = 0;

        for (const queue of sameTypeQueues) {
            const stats = queue.getStats();
            tasksTotal += stats.total;
            tasksSuccess += stats.success;
            failed += stats.failed;
            workTotal += stats.work.total;
            workSuccess += stats.work.success;
            running += stats.running;
            pending += stats.pending;
        }

        currentProgressByType[type] = {
            type,
            queues: sameTypeQueues.length,
            tasks: {
                total: tasksTotal,
                success: tasksSuccess,
            },
            failed,
            work: {
                total: workTotal,
                success: workSuccess,
            },
            running,
            pending,
        };

        this._progressByTypesSubject.next(currentProgressByType);
    }

    private _emitRegistryEvent(event: TaskQueueRegistryEvent): void {
        this._registryEventsSubject.next(event);
    }

    private async *_iterateRecords<TRecord>(records: Iterable<TRecord> | AsyncIterable<TRecord>): AsyncGenerator<TRecord> {
        if (Symbol.asyncIterator in records) {
            for await (const record of records as AsyncIterable<TRecord>) {
                yield record;
            }
            return;
        }

        for (const record of records as Iterable<TRecord>) {
            yield record;
        }
    }
}
