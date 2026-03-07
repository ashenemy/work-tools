import { Inject, Injectable, OnApplicationBootstrap, OnApplicationShutdown, Optional as Optional_ } from '@nestjs/common';
import { BrokerService } from '@work-tools/broker-service';
import { LoggerService } from '@work-tools/logger-service';
import { TaskQueue, TaskQueueCoordinator } from '@work-tools/taskqueue';
import type { JsonLike } from '@work-tools/ts';
import type { TaskQueueOptions, TaskQueueProgressEvent, TaskQueueRegistryEvent, TaskQueueTaskEvent } from '@work-tools/taskqueue';
import { randomUUID } from 'node:crypto';
import { Subscription } from 'rxjs';
import { QUEUE_MODULE_OPTIONS, QUEUE_SNAPSHOT_VERSION, QUEUE_STATE_STORE } from './queue.constants';
import { QueueTask } from './utils/queue-task.class';
import type {
    QueueResolvedOptions,
    QueueRestoreSummary,
    QueueStateSnapshot,
    QueueStateStore,
    QueueTaskChangedEvent,
    QueueTaskDescriptor,
    QueueTaskErrorSnapshot,
    QueueTaskHandler,
    QueueTaskHandlerRegistration,
    QueueTaskStateRecord,
} from './queue.types';

@Injectable()
export class QueueService implements OnApplicationBootstrap, OnApplicationShutdown {
    private readonly _coordinator: TaskQueueCoordinator = new TaskQueueCoordinator();
    private readonly _taskHandlers: Map<string, QueueTaskHandler<JsonLike, unknown>> = new Map();
    private readonly _queueTaskSubscriptions: Map<string, Subscription> = new Map();
    private readonly _coordinatorSubscriptions: Subscription[] = [];
    private _state: QueueStateSnapshot = this._createEmptyState();
    private _persistChain: Promise<void> = Promise.resolve();
    private _restoreInProgress: Promise<QueueRestoreSummary> | null = null;
    private _alreadyRestored = false;

    constructor(
        @Inject(QUEUE_MODULE_OPTIONS)
        private readonly _options: QueueResolvedOptions,
        @Inject(QUEUE_STATE_STORE)
        private readonly _stateStore: QueueStateStore,
        private readonly _logger: LoggerService,
        @Optional_()
        private readonly _brokerService?: BrokerService,
    ) {}

    public async onApplicationBootstrap(): Promise<void> {
        this.registerTaskHandlers(this._options.taskHandlers);
        this._bindCoordinatorEvents();
        await this._loadState();
        await this._restoreQueuesFromState();
        await this._createInitialQueues();

        if (this._options.autoRestore) {
            await this.restoreState();
        }
    }

    public async onApplicationShutdown(): Promise<void> {
        for (const subscription of this._queueTaskSubscriptions.values()) {
            subscription.unsubscribe();
        }
        this._queueTaskSubscriptions.clear();

        for (const subscription of this._coordinatorSubscriptions) {
            subscription.unsubscribe();
        }
        this._coordinatorSubscriptions.length = 0;

        await this._persistState();
    }

    public registerTaskHandler<TPayload extends JsonLike = JsonLike, TResult = unknown>(taskType: string, handler: QueueTaskHandler<TPayload, TResult>): void {
        const normalizedTaskType = this._normalizeNonEmptyString(taskType, 'Task type');
        this._taskHandlers.set(normalizedTaskType, handler as QueueTaskHandler<JsonLike, unknown>);
    }

    public registerTaskHandlers(handlers: QueueTaskHandlerRegistration[]): void {
        for (const handlerRegistration of handlers) {
            this.registerTaskHandler(handlerRegistration.taskType, handlerRegistration.handler);
        }
    }

    public unregisterTaskHandler(taskType: string): boolean {
        const normalizedTaskType = this._normalizeNonEmptyString(taskType, 'Task type');
        return this._taskHandlers.delete(normalizedTaskType);
    }

    public hasTaskHandler(taskType: string): boolean {
        const normalizedTaskType = this._normalizeNonEmptyString(taskType, 'Task type');
        return this._taskHandlers.has(normalizedTaskType);
    }

    public createQueue(name: string, options: TaskQueueOptions): TaskQueue {
        const queueName = this._normalizeNonEmptyString(name, 'Queue name');
        const normalizedOptions = this._normalizeQueueOptions(options);
        const existed = this._coordinator.getQueue(queueName);

        if (existed) {
            if (normalizedOptions.type && existed.type !== normalizedOptions.type) {
                throw new Error(`Queue "${queueName}" already exists with type "${existed.type}".`);
            }

            existed.setConcurrency(normalizedOptions.concurrency);
            this._upsertQueueState(existed);
            void this._persistState();
            return existed;
        }

        const queue = this._coordinator.createQueue(queueName, normalizedOptions);
        this._bindQueueTaskEvents(queue);
        this._upsertQueueState(queue);
        void this._persistState();
        return queue;
    }

    public createOrGetQueue(name: string, options: TaskQueueOptions): TaskQueue {
        return this.createQueue(name, options);
    }

    public removeQueue(name: string): boolean {
        const queueName = this._normalizeNonEmptyString(name, 'Queue name');
        const removed = this._coordinator.removeQueue(queueName);

        if (!removed) {
            return false;
        }

        const queueSubscription = this._queueTaskSubscriptions.get(queueName);
        if (queueSubscription) {
            queueSubscription.unsubscribe();
            this._queueTaskSubscriptions.delete(queueName);
        }

        delete this._state.queues[queueName];
        void this._persistState();

        return true;
    }

    public clearQueues(): void {
        this._coordinator.clearQueues();

        for (const subscription of this._queueTaskSubscriptions.values()) {
            subscription.unsubscribe();
        }
        this._queueTaskSubscriptions.clear();

        this._state.queues = {};
        void this._persistState();
    }

    public setQueueConcurrency(name: string, concurrency: number): boolean {
        const queueName = this._normalizeNonEmptyString(name, 'Queue name');
        const normalizedConcurrency = this._normalizeConcurrency(concurrency);
        const changed = this._coordinator.setQueueConcurrency(queueName, normalizedConcurrency);

        if (!changed) {
            return false;
        }

        const queue = this._coordinator.getQueue(queueName);
        if (queue) {
            this._upsertQueueState(queue);
            void this._persistState();
        }

        return true;
    }

    public listQueues(): TaskQueue[] {
        return this._coordinator.listQueues();
    }

    public getQueue(name: string): TaskQueue | undefined {
        const queueName = this._normalizeNonEmptyString(name, 'Queue name');
        return this._coordinator.getQueue(queueName);
    }

    public getStateSnapshot(): QueueStateSnapshot {
        return this._cloneState(this._state);
    }

    public async enqueue<TPayload extends JsonLike = JsonLike, TResult = unknown>(descriptor: QueueTaskDescriptor<TPayload>): Promise<TResult> {
        const queueName = this._normalizeNonEmptyString(descriptor.queueName, 'Queue name');
        const taskType = this._normalizeNonEmptyString(descriptor.taskType, 'Task type');
        const queueOptions = descriptor.queueOptions ?? this._resolveQueueOptionsFromState(queueName) ?? { concurrency: 1 };
        const queue = this.createQueue(queueName, queueOptions);
        const handler = this._taskHandlers.get(taskType);

        if (!handler) {
            throw new Error(`Task handler "${taskType}" is not registered.`);
        }

        const taskId = this._resolveTaskId(descriptor.taskId);
        this._assertTaskIdAvailable(taskId);

        const taskRecord = this._createTaskRecord(queue, descriptor, taskId);
        this._state.tasks[taskId] = taskRecord;
        await this._persistState();

        try {
            const runtimeTask = this._createRuntimeTask(taskRecord, handler as QueueTaskHandler<JsonLike, TResult>);
            return await this._coordinator.enqueue(queueName, runtimeTask);
        } catch (error) {
            await this._markTaskAsFailed(taskId, error);
            throw error;
        }
    }

    public async restoreState(force = false): Promise<QueueRestoreSummary> {
        if (this._restoreInProgress) {
            return await this._restoreInProgress;
        }

        if (this._alreadyRestored && !force) {
            return {
                total: 0,
                restored: 0,
                failed: 0,
            };
        }

        this._restoreInProgress = this._restorePendingTasks().finally(() => {
            this._restoreInProgress = null;
            this._alreadyRestored = true;
        });

        return await this._restoreInProgress;
    }

    private _bindCoordinatorEvents(): void {
        const queueProgressSubscription = this._coordinator.queueProgress$.subscribe((event: TaskQueueProgressEvent) => {
            void this._handleQueueProgressEvent(event);
        });

        const queueRegistrySubscription = this._coordinator.registryEvents$.subscribe((event: TaskQueueRegistryEvent) => {
            void this._handleQueueRegistryEvent(event);
        });

        this._coordinatorSubscriptions.push(queueProgressSubscription, queueRegistrySubscription);
    }

    private _bindQueueTaskEvents(queue: TaskQueue): void {
        if (this._queueTaskSubscriptions.has(queue.name)) {
            return;
        }

        const queueTaskSubscription = queue.taskEvents$.subscribe((event: TaskQueueTaskEvent) => {
            void this._handleQueueTaskEvent(event);
        });

        this._queueTaskSubscriptions.set(queue.name, queueTaskSubscription);
    }

    private async _loadState(): Promise<void> {
        try {
            this._state = await this._stateStore.load();
        } catch (error) {
            this._logger.error('Failed to load queue state snapshot.', error);
            this._state = this._createEmptyState();
            await this._persistState();
        }
    }

    private async _restoreQueuesFromState(): Promise<void> {
        const queueRecords = Object.values(this._state.queues);

        for (const queueRecord of queueRecords) {
            try {
                this.createQueue(queueRecord.name, queueRecord.options);
            } catch (error) {
                this._logger.error(`Failed to restore queue "${queueRecord.name}".`, error);
            }
        }
    }

    private async _createInitialQueues(): Promise<void> {
        for (const initialQueue of this._options.initialQueues) {
            try {
                this.createQueue(initialQueue.name, initialQueue.options);
            } catch (error) {
                this._logger.error(`Failed to create initial queue "${initialQueue.name}".`, error);
            }
        }
    }

    private async _restorePendingTasks(): Promise<QueueRestoreSummary> {
        const pendingTaskRecords = Object.values(this._state.tasks).filter((taskRecord) => taskRecord.status === 'pending' || taskRecord.status === 'running');
        const summary: QueueRestoreSummary = {
            total: pendingTaskRecords.length,
            restored: 0,
            failed: 0,
        };

        for (const taskRecord of pendingTaskRecords) {
            const handler = this._taskHandlers.get(taskRecord.taskType);

            if (!handler) {
                summary.failed += 1;
                await this._markTaskAsFailed(taskRecord.id, new Error(`Task handler "${taskRecord.taskType}" is not registered.`));
                continue;
            }

            try {
                this.createQueue(taskRecord.queueName, {
                    concurrency: taskRecord.queueConcurrency,
                    type: taskRecord.queueType,
                });

                taskRecord.status = 'pending';
                taskRecord.updatedAt = new Date().toISOString();

                const runtimeTask = this._createRuntimeTask(taskRecord, handler);
                const executionPromise = this._coordinator.enqueue(taskRecord.queueName, runtimeTask);

                void executionPromise.catch((error: unknown) => {
                    this._logger.error(`Restored task "${taskRecord.id}" failed during execution.`, error);
                });

                summary.restored += 1;
            } catch (error) {
                summary.failed += 1;
                await this._markTaskAsFailed(taskRecord.id, error);
            }
        }

        await this._persistState();
        await this._emitEvent(this._options.eventSubjects.restoreSummary, {
            summary,
        });

        return summary;
    }

    private async _handleQueueTaskEvent(event: TaskQueueTaskEvent): Promise<void> {
        const taskRecord = this._state.tasks[event.taskId];

        if (taskRecord) {
            taskRecord.status = event.status;
            taskRecord.progress = {
                total: event.progress.total,
                success: event.progress.success,
            };
            taskRecord.updatedAt = new Date().toISOString();

            if (event.event === 'started') {
                taskRecord.attempts += 1;
            }

            if (event.event === 'failed') {
                taskRecord.lastError = this._serializeError(event.error);
            }
        }

        void this._persistState();

        const payload: QueueTaskChangedEvent = {
            event,
            state: taskRecord,
        };

        await this._emitEvent(this._options.eventSubjects.taskChanged, payload);

        if (event.event === 'failed') {
            await this._emitEvent(this._options.eventSubjects.taskError, payload);
        }
    }

    private async _handleQueueProgressEvent(event: TaskQueueProgressEvent): Promise<void> {
        await this._emitEvent(this._options.eventSubjects.queueProgress, {
            event,
        });
    }

    private async _handleQueueRegistryEvent(event: TaskQueueRegistryEvent): Promise<void> {
        if (event.type === 'destroyed' && event.queueName) {
            delete this._state.queues[event.queueName];
            void this._persistState();
        }

        if (event.type === 'cleared') {
            this._state.queues = {};
            void this._persistState();
        }

        await this._emitEvent(this._options.eventSubjects.queueRegistry, {
            event,
        });
    }

    private _createTaskRecord<TPayload extends JsonLike>(queue: TaskQueue, descriptor: QueueTaskDescriptor<TPayload>, taskId: string): QueueTaskStateRecord<TPayload> {
        const now = new Date().toISOString();
        const progressTotal = this._normalizeNonNegativeInteger(descriptor.progressTotal);

        return {
            id: taskId,
            queueName: queue.name,
            queueType: queue.type,
            queueConcurrency: queue.getConcurrency(),
            taskType: descriptor.taskType,
            taskName: descriptor.taskName?.trim() || descriptor.taskType,
            payload: descriptor.payload,
            progress: {
                total: progressTotal,
                success: 0,
            },
            status: 'pending',
            attempts: 0,
            createdAt: now,
            updatedAt: now,
        };
    }

    private _createRuntimeTask<TResult = unknown>(record: QueueTaskStateRecord, handler: QueueTaskHandler<JsonLike, TResult>): QueueTask<TResult> {
        return new QueueTask(record, handler, {
            queueName: record.queueName,
            queueType: record.queueType,
        });
    }

    private _upsertQueueState(queue: TaskQueue): void {
        const now = new Date().toISOString();
        const existed = this._state.queues[queue.name];

        this._state.queues[queue.name] = {
            name: queue.name,
            options: {
                concurrency: queue.getConcurrency(),
                type: queue.type,
            },
            createdAt: existed?.createdAt ?? now,
            updatedAt: now,
        };
    }

    private async _markTaskAsFailed(taskId: string, error: unknown): Promise<void> {
        const taskRecord = this._state.tasks[taskId];

        if (!taskRecord) {
            return;
        }

        taskRecord.status = 'failed';
        taskRecord.updatedAt = new Date().toISOString();
        taskRecord.lastError = this._serializeError(error);
        await this._persistState();

        await this._emitEvent(this._options.eventSubjects.taskError, {
            event: {
                queueName: taskRecord.queueName,
                queueType: taskRecord.queueType,
                taskId: taskRecord.id,
                taskName: taskRecord.taskName,
                taskType: taskRecord.taskType,
                status: 'failed',
                progress: taskRecord.progress,
                event: 'failed',
                error,
            },
            state: taskRecord,
        });
    }

    private async _emitEvent(subject: string, payload: unknown): Promise<void> {
        if (!this._brokerService) {
            return;
        }

        try {
            await this._brokerService.emit(subject, payload);
        } catch (error) {
            this._logger.error(`Failed to publish queue event "${subject}".`, error);
        }
    }

    private _resolveQueueOptionsFromState(queueName: string): TaskQueueOptions | undefined {
        const queueRecord = this._state.queues[queueName];
        if (!queueRecord) {
            return undefined;
        }

        return {
            concurrency: queueRecord.options.concurrency,
            type: queueRecord.options.type,
        };
    }

    private _assertTaskIdAvailable(taskId: string): void {
        if (this._state.tasks[taskId]) {
            throw new Error(`Task "${taskId}" already exists.`);
        }
    }

    private _resolveTaskId(taskId: string | undefined): string {
        if (taskId) {
            return this._normalizeNonEmptyString(taskId, 'Task id');
        }

        return randomUUID();
    }

    private _normalizeQueueOptions(options: TaskQueueOptions): TaskQueueOptions {
        return {
            concurrency: this._normalizeConcurrency(options.concurrency),
            type: options.type?.trim() || undefined,
        };
    }

    private _normalizeConcurrency(value: number): number {
        if (!Number.isFinite(value)) {
            return 1;
        }

        return Math.max(1, Math.floor(value));
    }

    private _normalizeNonNegativeInteger(value: number | undefined): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return 0;
        }

        return Math.max(0, Math.floor(value));
    }

    private _normalizeNonEmptyString(value: string, label: string): string {
        const normalized = value.trim();

        if (normalized.length === 0) {
            throw new Error(`${label} must be a non-empty string.`);
        }

        return normalized;
    }

    private _serializeError(error: unknown): QueueTaskErrorSnapshot {
        if (error instanceof Error) {
            return {
                name: error.name,
                message: error.message,
                stack: error.stack,
            };
        }

        if (typeof error === 'string' && error.trim().length > 0) {
            return {
                message: error,
            };
        }

        return {
            message: 'Unknown error',
        };
    }

    private _createEmptyState(): QueueStateSnapshot {
        return {
            version: QUEUE_SNAPSHOT_VERSION,
            updatedAt: new Date().toISOString(),
            queues: {},
            tasks: {},
        };
    }

    private _cloneState(state: QueueStateSnapshot): QueueStateSnapshot {
        return JSON.parse(JSON.stringify(state)) as QueueStateSnapshot;
    }

    private async _persistState(): Promise<void> {
        this._state.updatedAt = new Date().toISOString();
        const stateSnapshot = this._cloneState(this._state);

        this._persistChain = this._persistChain
            .catch(() => undefined)
            .then(async () => {
                await this._stateStore.save(stateSnapshot);
            })
            .catch((error) => {
                this._logger.error('Failed to persist queue state snapshot.', error);
            });

        await this._persistChain;
    }
}
