import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { PendingQueueItem, Progress, TaskQueueOptions, TaskQueueStats, TaskQueueTaskEvent, TaskQueueTaskEventType, TaskStatus } from '../@types';
import { Task } from './task.class';

type Deferred<TResult> = {
    promise: Promise<TResult>;
    resolve: (value: TResult) => void;
    reject: (error: unknown) => void;
};
type EnqueueAccepted<TResult> = {
    accepted: true;
    promise: Promise<TResult>;
};
type EnqueueRejected = {
    accepted: false;
    reason: unknown;
};
type EnqueueResult<TResult> = EnqueueAccepted<TResult> | EnqueueRejected;

export class TaskQueue {
    private static readonly _createdSubject: Subject<TaskQueue> = new Subject<TaskQueue>();
    public static readonly created$: Observable<TaskQueue> = TaskQueue._createdSubject.asObservable();

    public readonly name: string;
    public readonly type: string;
    public readonly stats$: Observable<TaskQueueStats>;
    public readonly taskEvents$: Observable<TaskQueueTaskEvent>;

    private _concurrency: number;
    private readonly _pending: PendingQueueItem<any>[] = [];
    private readonly _runningItems: Map<string, PendingQueueItem<any>> = new Map();
    private readonly _startedTaskIds: Set<string> = new Set();
    private _running = 0;
    private _total = 0;
    private _success = 0;
    private _failed = 0;
    private _destroyed = false;
    private _shutdownReason: unknown = new Error('Queue was stopped.');
    private readonly _statsSubject: BehaviorSubject<TaskQueueStats>;
    private readonly _taskProgressMap: Map<string, Progress> = new Map();
    private readonly _taskProgressSubscriptions: Map<string, Subscription> = new Map();
    private readonly _taskEventsSubject: Subject<TaskQueueTaskEvent> = new Subject<TaskQueueTaskEvent>();

    public constructor(name: string, opts: TaskQueueOptions) {
        this.name = name;
        this.type = opts.type ?? 'default';
        this._concurrency = this._normalizeConcurrency(opts.concurrency);

        this._statsSubject = new BehaviorSubject<TaskQueueStats>({
            total: 0,
            success: 0,
            failed: 0,
            work: {
                total: 0,
                success: 0,
            },
            running: 0,
            pending: 0,
        });

        this.stats$ = this._statsSubject.asObservable();
        this.taskEvents$ = this._taskEventsSubject.asObservable();

        this._emitStats();
        TaskQueue._emitCreated(this);
    }

    private static _emitCreated(queue: TaskQueue): void {
        TaskQueue._createdSubject.next(queue);
    }

    public getConcurrency(): number {
        return this._concurrency;
    }

    public canAcceptTasks(): boolean {
        return !this._destroyed;
    }

    public setConcurrency(value: number): void {
        if (this._destroyed) {
            return;
        }

        this._concurrency = this._normalizeConcurrency(value);
        this._emitStats();
        void this._drain();
    }

    public getStats(): TaskQueueStats {
        return {
            total: this._total,
            success: this._success,
            failed: this._failed,
            work: this._resolveWorkProgress(),
            running: this._running,
            pending: this._pending.length,
        };
    }

    public enqueue<TPayload, TResult>(task: Task<TPayload, TResult>): Promise<TResult> {
        const enqueueResult = this.tryEnqueue(task);
        if (!enqueueResult.accepted) {
            return Promise.reject(enqueueResult.reason);
        }

        return enqueueResult.promise;
    }

    public tryEnqueue<TPayload, TResult>(task: Task<TPayload, TResult>): EnqueueResult<TResult> {
        if (this._destroyed) {
            return {
                accepted: false,
                reason: this._shutdownReason,
            };
        }

        const deferred = this._createDeferred<TResult>();
        this._pending.push({
            task,
            resolve: deferred.resolve,
            reject: deferred.reject,
        });
        this._total += 1;

        this._emitTaskEvent(task, 'enqueued', 'pending');
        this._registerTask(task);
        this._emitStats();
        void this._drain();

        return {
            accepted: true,
            promise: deferred.promise,
        };
    }

    public clearPending(reason: unknown = new Error(`Queue "${this.name}" pending items were cleared.`)): number {
        const droppedItems = this._pending.splice(0, this._pending.length);

        for (const item of droppedItems) {
            this._failed += 1;
            item.task.cancel(reason);
            this._emitTaskEvent(item.task, 'failed', 'failed', reason);
            this._unregisterTask(item.task.id);
            item.reject(reason);
        }

        this._emitStats();
        return droppedItems.length;
    }

    public shutdown(reason: unknown = new Error(`Queue "${this.name}" was stopped.`)): { pending: number; running: number } {
        if (this._destroyed) {
            return {
                pending: 0,
                running: 0,
            };
        }

        this._destroyed = true;
        this._shutdownReason = reason;

        const pendingItems = this._pending.splice(0, this._pending.length);
        const runningItems = Array.from(this._runningItems.values());
        const pending = pendingItems.length;
        const running = runningItems.length;

        for (const item of pendingItems) {
            this._failed += 1;
            item.task.cancel(reason);
            this._emitTaskEvent(item.task, 'failed', 'failed', reason);
            this._unregisterTask(item.task.id);
            item.reject(reason);
        }

        for (const item of runningItems) {
            this._failed += 1;
            this._emitTaskEvent(item.task, 'failed', 'failed', reason);
            item.task.cancel(reason);
            item.reject(reason);
        }

        this._runningItems.clear();
        this._startedTaskIds.clear();
        for (const taskId of Array.from(this._taskProgressSubscriptions.keys())) {
            this._unregisterTask(taskId);
        }

        this._running = 0;
        this._emitStats();
        this._taskEventsSubject.complete();
        this._statsSubject.complete();

        return {
            pending,
            running,
        };
    }

    private async _drain(): Promise<void> {
        if (this._destroyed) {
            return;
        }

        while (this._running < this._concurrency && this._pending.length > 0) {
            const nextItem = this._pending.shift();
            if (!nextItem) {
                return;
            }

            this._running += 1;
            this._emitStats();
            void this._run(nextItem);
        }
    }

    private async _run<TResult>(item: PendingQueueItem<TResult>): Promise<void> {
        const taskId = item.task.id;
        this._runningItems.set(taskId, item);
        this._startedTaskIds.add(taskId);
        this._emitTaskEvent(item.task, 'started', 'running');

        try {
            const result = await item.task.execute();
            item.resolve(result);

            if (!this._destroyed) {
                this._success += 1;
                this._emitTaskEvent(item.task, 'success', 'success');
            }
        } catch (error: unknown) {
            item.reject(error);

            if (!this._destroyed) {
                this._failed += 1;
                this._emitTaskEvent(item.task, 'failed', 'failed', error);
            }
        } finally {
            this._runningItems.delete(taskId);
            this._startedTaskIds.delete(taskId);
            this._running = Math.max(0, this._running - 1);
            this._unregisterTask(taskId);

            if (!this._destroyed) {
                this._emitStats();
                void this._drain();
            }
        }
    }

    private _registerTask(task: Task<any, any>): void {
        const taskId = task.id;
        this._taskProgressMap.set(taskId, this._normalizeProgress(task.getProgress()));

        let initialEmission = true;
        const progressSubscription = task.progress$.subscribe({
            next: (progress: Progress) => {
                if (this._destroyed) {
                    return;
                }

                this._taskProgressMap.set(taskId, this._normalizeProgress(progress));

                if (initialEmission) {
                    initialEmission = false;
                    return;
                }

                if (this._startedTaskIds.has(taskId)) {
                    this._emitTaskEvent(task, 'progress', 'running');
                }

                this._emitStats();
            },
        });

        this._taskProgressSubscriptions.set(taskId, progressSubscription);
    }

    private _unregisterTask(taskId: string): void {
        const subscription = this._taskProgressSubscriptions.get(taskId);
        if (subscription) {
            subscription.unsubscribe();
            this._taskProgressSubscriptions.delete(taskId);
        }

        this._taskProgressMap.delete(taskId);
    }

    private _resolveWorkProgress(): Progress {
        let total = 0;
        let success = 0;

        for (const progress of this._taskProgressMap.values()) {
            total += progress.total;
            success += progress.success;
        }

        return {
            total,
            success,
        };
    }

    private _emitStats(): void {
        if (this._statsSubject.closed || this._statsSubject.isStopped) {
            return;
        }

        this._statsSubject.next(this.getStats());
    }

    private _emitTaskEvent(task: Task<any, any>, event: TaskQueueTaskEventType, status: TaskStatus = task.getStatus(), error?: unknown): void {
        if (this._taskEventsSubject.closed || this._taskEventsSubject.isStopped) {
            return;
        }

        const eventPayload: TaskQueueTaskEvent = {
            queueName: this.name,
            queueType: this.type,
            taskId: task.id,
            taskName: task.name,
            taskType: task.type,
            status,
            progress: this._taskProgressMap.get(task.id) ?? this._normalizeProgress(task.getProgress()),
            event,
        };

        if (error !== undefined) {
            eventPayload.error = error;
        }

        this._taskEventsSubject.next(eventPayload);
    }

    private _normalizeProgress(progress: Progress): Progress {
        const total = this._toNonNegativeCount(progress.total);
        const success = Math.min(this._toNonNegativeCount(progress.success), total);

        return {
            total,
            success,
        };
    }

    private _normalizeConcurrency(value: number): number {
        if (!Number.isFinite(value)) {
            return 1;
        }

        return Math.max(1, Math.floor(value));
    }

    private _toNonNegativeCount(value: number): number {
        if (!Number.isFinite(value)) {
            return 0;
        }

        return Math.max(0, Math.floor(value));
    }

    private _createDeferred<TResult>(): Deferred<TResult> {
        let resolveRef: ((value: TResult) => void) | undefined;
        let rejectRef: ((error: unknown) => void) | undefined;

        const promise = new Promise<TResult>((resolve, reject) => {
            resolveRef = resolve;
            rejectRef = reject;
        });

        if (!resolveRef || !rejectRef) {
            throw new Error('Failed to create deferred promise.');
        }

        return {
            promise,
            resolve: resolveRef,
            reject: rejectRef,
        };
    }
}
