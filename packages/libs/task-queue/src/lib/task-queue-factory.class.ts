import { TaskQueue } from './task-queue.class';
import { QueueTypeProgress, TaskQueueOptions, TaskQueueRegistryEvent } from '../@types';
import { Optional } from '@work-tools/ts';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';

export class TaskQueueFactory {
    private static readonly map = new Map<string, TaskQueue>();
    private static readonly queueSubscriptions = new Map<string, Subscription>();
    private static readonly _progressByTypesSubject = new BehaviorSubject<Record<string, QueueTypeProgress>>({});
    public static readonly progressByTypes$: Observable<Record<string, QueueTypeProgress>> = TaskQueueFactory._progressByTypesSubject.asObservable();
    private static readonly _registryEventsSubject = new Subject<TaskQueueRegistryEvent>();
    public static readonly registryEvents$: Observable<TaskQueueRegistryEvent> = TaskQueueFactory._registryEventsSubject.asObservable();

    public static get(name: string): Optional<TaskQueue> {
        return this.map.get(name);
    }

    public static getOrCreate(name: string, opts: TaskQueueOptions): TaskQueue {
        const existing = this.map.get(name);
        if (existing) {
            existing.setConcurrency(opts.concurrency);
            this._emitTypeProgress();
            return existing;
        }

        const q = new TaskQueue(name, opts);
        this.map.set(name, q);
        this._bindQueue(q);
        this._emitRegistryEvent({ type: 'created', queueName: name });
        return q;
    }

    public static list(): TaskQueue[] {
        return [...this.map.values()];
    }

    public static listNames(): string[] {
        return [...this.map.keys()];
    }

    public static listByType(type: string): TaskQueue[] {
        return this.list().filter((queue) => queue.type === type);
    }

    public static getTypeProgress(type: string): Optional<QueueTypeProgress> {
        return this.getProgressByTypes()[type];
    }

    public static getProgressByTypes(): Record<string, QueueTypeProgress> {
        const grouped = new Map<string, QueueTypeProgress>();

        for (const queue of this.map.values()) {
            const queueStats = queue.getStats();
            const aggregate = grouped.get(queue.type) ?? {
                type: queue.type,
                queues: 0,
                tasks: { total: 0, success: 0 },
                failed: 0,
                work: { total: 0, success: 0 },
                running: 0,
                pending: 0,
            };

            aggregate.queues += 1;
            aggregate.tasks.total += queueStats.total;
            aggregate.tasks.success += queueStats.success;
            aggregate.failed += queueStats.failed;
            aggregate.work.total += queueStats.work.total;
            aggregate.work.success += queueStats.work.success;
            aggregate.running += queueStats.running;
            aggregate.pending += queueStats.pending;

            grouped.set(queue.type, aggregate);
        }

        return Object.fromEntries(grouped.entries());
    }

    public static destroy(name: string): boolean {
        const existed = this.map.delete(name);
        const subscription = this.queueSubscriptions.get(name);

        subscription?.unsubscribe();
        this.queueSubscriptions.delete(name);
        this._emitTypeProgress();

        if (existed) {
            this._emitRegistryEvent({ type: 'destroyed', queueName: name });
        }

        return existed;
    }

    public static clear(): void {
        for (const subscription of this.queueSubscriptions.values()) {
            subscription.unsubscribe();
        }

        this.queueSubscriptions.clear();
        this.map.clear();
        this._emitTypeProgress();
        this._emitRegistryEvent({ type: 'cleared' });
    }

    private static _bindQueue(queue: TaskQueue): void {
        this.queueSubscriptions.get(queue.name)?.unsubscribe();

        const subscription = queue.stats$.subscribe(() => {
            this._emitTypeProgress();
        });

        this.queueSubscriptions.set(queue.name, subscription);
        this._emitTypeProgress();
    }

    private static _emitTypeProgress(): void {
        this._progressByTypesSubject.next(this.getProgressByTypes());
    }

    private static _emitRegistryEvent(event: TaskQueueRegistryEvent): void {
        this._registryEventsSubject.next(event);
    }
}
