import { Optional } from '@work-tools/ts';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { PersistedTaskDescriptor, QueueTypeProgress, RestoreTasksResult, TaskQueueOptions, TaskQueueRegistryEvent } from '../@types';
import { TaskQueue } from './task-queue.class';

export class TaskQueueFactory {
    private static readonly map: Map<string, TaskQueue> = new Map();
    private static readonly queueSubscriptions: Map<string, Subscription> = new Map();

    private static readonly _progressByTypesSubject: BehaviorSubject<Record<string, QueueTypeProgress>> = new BehaviorSubject<Record<string, QueueTypeProgress>>({});
    public static readonly progressByTypes$: Observable<Record<string, QueueTypeProgress>> = TaskQueueFactory._progressByTypesSubject.asObservable();

    private static readonly _registryEventsSubject: Subject<TaskQueueRegistryEvent> = new Subject<TaskQueueRegistryEvent>();
    public static readonly registryEvents$: Observable<TaskQueueRegistryEvent> = TaskQueueFactory._registryEventsSubject.asObservable();

    public static get(name: string): Optional<TaskQueue> {
        return TaskQueueFactory.map.get(name);
    }

    public static getOrCreate(name: string, opts: TaskQueueOptions): TaskQueue {
        const existed = TaskQueueFactory.get(name);
        if (existed) {
            return existed;
        }

        const queue = new TaskQueue(name, opts);
        TaskQueueFactory.map.set(name, queue);
        TaskQueueFactory._bindQueue(queue);
        TaskQueueFactory._emitTypeProgress(queue.type);
        TaskQueueFactory._emitRegistryEvent({
            type: 'created',
            queueName: name,
        });

        return queue;
    }

    public static list(): TaskQueue[] {
        return Array.from(TaskQueueFactory.map.values());
    }

    public static listNames(): string[] {
        return Array.from(TaskQueueFactory.map.keys());
    }

    public static listByType(type: string): TaskQueue[] {
        return TaskQueueFactory.list().filter((queue) => queue.type === type);
    }

    public static getTypeProgress(type: string): Optional<QueueTypeProgress> {
        return TaskQueueFactory._progressByTypesSubject.value[type];
    }

    public static getProgressByTypes(): Record<string, QueueTypeProgress> {
        return {
            ...TaskQueueFactory._progressByTypesSubject.value,
        };
    }

    public static destroy(name: string): boolean {
        const queue = TaskQueueFactory.map.get(name);
        if (!queue) {
            return false;
        }

        queue.shutdown(new Error(`Queue "${name}" was destroyed.`));

        const queueSubscription = TaskQueueFactory.queueSubscriptions.get(name);
        if (queueSubscription) {
            queueSubscription.unsubscribe();
            TaskQueueFactory.queueSubscriptions.delete(name);
        }

        TaskQueueFactory.map.delete(name);
        TaskQueueFactory._emitTypeProgress(queue.type);
        TaskQueueFactory._emitRegistryEvent({
            type: 'destroyed',
            queueName: name,
        });
        return true;
    }

    public static clear(): void {
        for (const queueName of TaskQueueFactory.listNames()) {
            TaskQueueFactory.destroy(queueName);
        }

        TaskQueueFactory._emitRegistryEvent({
            type: 'cleared',
        });
    }

    public static async restoreSavedTasks<TRecord>(records: Iterable<TRecord> | AsyncIterable<TRecord>, mapper: (record: TRecord) => PersistedTaskDescriptor | Promise<PersistedTaskDescriptor>): Promise<RestoreTasksResult<TRecord>> {
        const errors: Array<{ record: TRecord; error: unknown }> = [];
        let total = 0;
        let enqueued = 0;

        for await (const record of TaskQueueFactory._iterateRecords(records)) {
            total += 1;

            try {
                const descriptor = await mapper(record);
                const queueOptions: TaskQueueOptions = descriptor.queueOptions ?? { concurrency: 1 };
                const queue = TaskQueueFactory.getOrCreate(descriptor.queueName, queueOptions);

                if (descriptor.queueOptions) {
                    queue.setConcurrency(descriptor.queueOptions.concurrency);
                }

                const enqueueResult = queue.tryEnqueue(descriptor.task);
                if (!enqueueResult.accepted) {
                    throw enqueueResult.reason;
                }

                const executionPromise = enqueueResult.promise;
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

    private static _bindQueue(queue: TaskQueue): void {
        const queueStatsSubscription = queue.stats$.subscribe(() => {
            TaskQueueFactory._emitTypeProgress(queue.type);
        });

        TaskQueueFactory.queueSubscriptions.set(queue.name, queueStatsSubscription);
    }

    private static _emitTypeProgress(type: string): void {
        const sameTypeQueues = TaskQueueFactory.listByType(type);
        const currentProgressByType = TaskQueueFactory.getProgressByTypes();

        if (sameTypeQueues.length === 0) {
            delete currentProgressByType[type];
            TaskQueueFactory._progressByTypesSubject.next(currentProgressByType);
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

        TaskQueueFactory._progressByTypesSubject.next(currentProgressByType);
    }

    private static _emitRegistryEvent(event: TaskQueueRegistryEvent): void {
        TaskQueueFactory._registryEventsSubject.next(event);
    }

    private static async *_iterateRecords<TRecord>(records: Iterable<TRecord> | AsyncIterable<TRecord>): AsyncGenerator<TRecord> {
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
