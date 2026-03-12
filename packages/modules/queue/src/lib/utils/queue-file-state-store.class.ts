import { dirname, resolve } from 'node:path';
import { ensureDir, pathExists, readFile, writeFile } from 'fs-extra';
import type { QueueStateQueueRecord, QueueStateSnapshot, QueueStateStore, QueueTaskStateRecord } from '../../@types';
import { QUEUE_SNAPSHOT_VERSION } from '../queue.constants';

const ALLOWED_TASK_STATUSES = new Set(['pending', 'running', 'success', 'failed']);

export class QueueFileStateStore implements QueueStateStore {
    private readonly _absPath: string;

    constructor(filePath: string) {
        this._absPath = resolve(filePath);
    }

    public async load(): Promise<QueueStateSnapshot> {
        if (!(await pathExists(this._absPath))) {
            const state = this._createEmptyState();
            await this.save(state);
            return state;
        }

        const content = await readFile(this._absPath, 'utf-8');

        if (content.trim().length === 0) {
            const state = this._createEmptyState();
            await this.save(state);
            return state;
        }

        try {
            const parsed = JSON.parse(content) as unknown;
            return this._normalizeState(parsed);
        } catch {
            const state = this._createEmptyState();
            await this.save(state);
            return state;
        }
    }

    public async save(state: QueueStateSnapshot): Promise<void> {
        const normalizedState = this._normalizeState(state);

        await ensureDir(dirname(this._absPath));
        await writeFile(this._absPath, JSON.stringify(normalizedState, null, 4), 'utf-8');
    }

    private _createEmptyState(): QueueStateSnapshot {
        const timestamp = new Date().toISOString();

        return { queues: {}, tasks: {}, updatedAt: timestamp, version: QUEUE_SNAPSHOT_VERSION };
    }

    private _normalizeState(raw: unknown): QueueStateSnapshot {
        const fallback = this._createEmptyState();

        if (!this._isObject(raw)) {
            return fallback;
        }

        const normalizedQueues: Record<string, QueueStateQueueRecord> = {};
        const rawQueues = this._isObject(raw.queues) ? raw.queues : {};

        for (const [queueName, queueRecord] of Object.entries(rawQueues)) {
            if (!this._isObject(queueRecord)) {
                continue;
            }

            const queueOptions = this._isObject(queueRecord.options) ? queueRecord.options : {};
            const concurrency = this._normalizeConcurrency(queueOptions.concurrency);
            const queueType = this._normalizeOptionalString(queueOptions.type);
            const now = new Date().toISOString();

            normalizedQueues[queueName] = {
                createdAt: this._normalizeOptionalString(queueRecord.createdAt) ?? now,
                name: this._normalizeOptionalString(queueRecord.name) ?? queueName,
                options: { concurrency, type: queueType },
                updatedAt: this._normalizeOptionalString(queueRecord.updatedAt) ?? now,
            };
        }

        const normalizedTasks: Record<string, QueueTaskStateRecord> = {};
        const rawTasks = this._isObject(raw.tasks) ? raw.tasks : {};

        for (const [taskId, taskRecord] of Object.entries(rawTasks)) {
            if (!this._isObject(taskRecord)) {
                continue;
            }

            const now = new Date().toISOString();
            const status = this._normalizeTaskStatus(taskRecord.status);
            const progress = this._isObject(taskRecord.progress) ? taskRecord.progress : {};
            const progressTotal = this._normalizeNonNegativeInteger(progress.total);
            const progressSuccess = Math.min(this._normalizeNonNegativeInteger(progress.success), progressTotal);
            const normalizedQueueName = this._normalizeOptionalString(taskRecord.queueName);

            if (!normalizedQueueName) {
                continue;
            }

            normalizedTasks[taskId] = {
                attempts: this._normalizeNonNegativeInteger(taskRecord.attempts),
                createdAt: this._normalizeOptionalString(taskRecord.createdAt) ?? now,
                id: this._normalizeOptionalString(taskRecord.id) ?? taskId,
                lastError: this._normalizeError(taskRecord.lastError),
                payload: this._normalizeJsonLike(taskRecord.payload),
                progress: { success: progressSuccess, total: progressTotal },
                queueConcurrency: this._normalizeConcurrency(taskRecord.queueConcurrency),
                queueName: normalizedQueueName,
                queueType: this._normalizeOptionalString(taskRecord.queueType) ?? 'default',
                status,
                taskName: this._normalizeOptionalString(taskRecord.taskName) ?? 'Task',
                taskType: this._normalizeOptionalString(taskRecord.taskType) ?? 'default',
                updatedAt: this._normalizeOptionalString(taskRecord.updatedAt) ?? now,
            };
        }

        return {
            queues: normalizedQueues,
            tasks: normalizedTasks,
            updatedAt: this._normalizeOptionalString(raw.updatedAt) ?? new Date().toISOString(),
            version: QUEUE_SNAPSHOT_VERSION,
        };
    }

    private _normalizeError(raw: unknown): QueueTaskStateRecord['lastError'] {
        if (!this._isObject(raw)) {
            return undefined;
        }

        const message = this._normalizeOptionalString(raw.message);
        if (!message) {
            return undefined;
        }

        return { message, name: this._normalizeOptionalString(raw.name), stack: this._normalizeOptionalString(raw.stack) };
    }

    private _normalizeTaskStatus(value: unknown): QueueTaskStateRecord['status'] {
        if (typeof value === 'string' && ALLOWED_TASK_STATUSES.has(value)) {
            return value as QueueTaskStateRecord['status'];
        }

        return 'pending';
    }

    private _normalizeConcurrency(value: unknown): number {
        return Math.max(1, this._normalizeNonNegativeInteger(value) || 1);
    }

    private _normalizeNonNegativeInteger(value: unknown): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return 0;
        }

        return Math.max(0, Math.floor(value));
    }

    private _normalizeOptionalString(value: unknown): string | undefined {
        if (typeof value !== 'string') {
            return undefined;
        }

        const normalized = value.trim();
        return normalized.length > 0 ? normalized : undefined;
    }

    private _normalizeJsonLike(value: unknown): QueueTaskStateRecord['payload'] {
        if (value === null) {
            return null;
        }

        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return value;
        }

        if (Array.isArray(value)) {
            return value as QueueTaskStateRecord['payload'];
        }

        if (this._isObject(value)) {
            return value as QueueTaskStateRecord['payload'];
        }

        return null;
    }

    private _isObject(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null;
    }
}
