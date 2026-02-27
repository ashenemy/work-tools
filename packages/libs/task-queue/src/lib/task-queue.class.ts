import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { PendingQueueItem, Progress, TaskQueueOptions, TaskQueueStats, TaskQueueTaskEvent, TaskQueueTaskEventType } from '../@types';
import { Task } from './task.class';
import { Deferred } from '@work-tools/utils';



export class TaskQueue {
    private static readonly _createdSubject = new Subject<TaskQueue>();
    public static readonly created$: Observable<TaskQueue> = TaskQueue._createdSubject.asObservable();

    public readonly type: string;
    public readonly stats$: Observable<TaskQueueStats>;
    public readonly taskEvents$: Observable<TaskQueueTaskEvent>;

    private _concurrency: number;
    private readonly _pending: PendingQueueItem<any>[] = [];
    private _running = 0;
    private _total = 0;
    private _success = 0;
    private _failed = 0;
    private readonly _statsSubject: BehaviorSubject<TaskQueueStats>;
    private readonly _taskProgressMap = new Map<string, Progress>();
    private readonly _taskProgressSubscriptions = new Map<string, Subscription>();
    private readonly _taskEventsSubject = new Subject<TaskQueueTaskEvent>();

    public constructor(
        public readonly name: string,
        opts: TaskQueueOptions,
    ) {
        this._concurrency = this._normalizeConcurrency(opts.concurrency);
        this.type = opts.type ?? name;

        this._statsSubject = new BehaviorSubject<TaskQueueStats>({
            total: 0,
            success: 0,
            failed: 0,
            work: { total: 0, success: 0 },
            running: 0,
            pending: 0,
        });
        this.stats$ = this._statsSubject.asObservable();
        this.taskEvents$ = this._taskEventsSubject.asObservable();

        TaskQueue._emitCreated(this);
    }

    private static _emitCreated(queue: TaskQueue): void {
        this._createdSubject.next(queue);
    }

    public getConcurrency(): number {
        return this._concurrency;
    }

    public setConcurrency(value: number): void {
        this._concurrency = this._normalizeConcurrency(value);
        this._emitStats();
        this._drain();
    }

    public getStats(): TaskQueueStats {
        return this._statsSubject.value;
    }

    public enqueue<TPayload, TResult>(task: Task<TPayload, TResult>): Promise<TResult> {
        this._registerTask(task);
        this._total += 1;

        const deferred = this._createDeferred<TResult>();

        this._pending.push({
            task,
            resolve: deferred.resolve,
            reject: deferred.reject,
        });

        this._emitTaskEvent(task, 'enqueued');
        this._emitStats();
        this._drain();

        return deferred.promise;
    }

    public clearPending(reason: unknown = new Error('Task was removed from queue')): number {
        const pending = this._pending.splice(0, this._pending.length);

        for (const item of pending) {
            this._total -= 1;
            this._unregisterTask(item.task.id);
            item.reject(reason);
        }

        this._emitStats();
        return pending.length;
    }

    private _drain(): void {
        while (this._running < this._concurrency && this._pending.length > 0) {
            const next = this._pending.shift();

            if (!next) {
                break;
            }

            this._running += 1;
            this._emitStats();
            void this._run(next);
        }
    }

    private async _run(item: PendingQueueItem<any>): Promise<void> {
        this._emitTaskEvent(item.task, 'started');

        try {
            const result = await item.task.execute();
            this._success += 1;
            this._emitTaskEvent(item.task, 'success');
            item.resolve(result);
        } catch (error) {
            this._failed += 1;
            this._emitTaskEvent(item.task, 'failed', error);
            item.reject(error);
        } finally {
            this._running -= 1;
            this._taskProgressSubscriptions.get(item.task.id)?.unsubscribe();
            this._taskProgressSubscriptions.delete(item.task.id);
            this._emitStats();
            this._drain();
        }
    }

    private _registerTask(task: Task<unknown, unknown>): void {
        this._taskProgressMap.set(task.id, task.getProgress());
        this._taskProgressSubscriptions.get(task.id)?.unsubscribe();

        const sub = task.progress$.subscribe((next) => {
            this._taskProgressMap.set(task.id, this._normalizeProgress(next));
            this._emitTaskEvent(task, 'progress');
            this._emitStats();
        });

        this._taskProgressSubscriptions.set(task.id, sub);
    }

    private _unregisterTask(taskId: string): void {
        this._taskProgressSubscriptions.get(taskId)?.unsubscribe();
        this._taskProgressSubscriptions.delete(taskId);
        this._taskProgressMap.delete(taskId);
    }

    private _resolveWorkProgress(): Progress {
        let total = 0;
        let success = 0;

        for (const value of this._taskProgressMap.values()) {
            total += value.total;
            success += Math.min(value.success, value.total);
        }

        return { total, success };
    }

    private _emitStats(): void {
        this._statsSubject.next({
            total: this._total,
            success: this._success,
            failed: this._failed,
            work: this._resolveWorkProgress(),
            running: this._running,
            pending: this._pending.length,
        });
    }

    private _emitTaskEvent(task: Task<unknown, unknown>, event: TaskQueueTaskEventType, error?: unknown): void {
        const payload: TaskQueueTaskEvent = {
            queueName: this.name,
            queueType: this.type,
            taskId: task.id,
            taskName: task.name,
            taskType: task.type,
            status: task.getStatus(),
            progress: this._taskProgressMap.get(task.id) ?? task.getProgress(),
            event,
            error,
        };

        this._taskEventsSubject.next(payload);
    }

    private _normalizeProgress(progress: Progress): Progress {
        const total = Number.isFinite(progress.total) && progress.total > 0 ? Math.floor(progress.total) : 1;
        const success = Number.isFinite(progress.success) ? Math.floor(progress.success) : 0;

        return {
            total,
            success: Math.min(Math.max(0, success), total),
        };
    }

    private _normalizeConcurrency(value: number): number {
        const n = Math.floor(value);

        if (!Number.isFinite(n) || n < 1) {
            return 1;
        }

        return n;
    }

    private _createDeferred<TResult>(): Deferred<TResult> {
        let resolve: ((value: TResult) => void) | undefined;
        let reject: ((reason: unknown) => void) | undefined;

        const promise = new Promise<TResult>((res, rej) => {
            resolve = res;
            reject = rej;
        });

        return {
            promise,
            resolve: (value: TResult) => resolve?.(value),
            reject: (reason: unknown) => reject?.(reason),
        };
    }
}
