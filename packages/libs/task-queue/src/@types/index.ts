import { Task } from '../lib/task.class';

export type Progress = {
    total: number;
    success: number;
};

export type TaskStatus = 'pending' | 'running' | 'success' | 'failed';

export type TaskQueueOptions = {
    concurrency: number;
    type?: string;
};

export type TaskQueueStats = {
    total: number;
    success: number;
    failed: number;
    work: Progress;
    running: number;
    pending: number;
};

export type QueueTypeProgress = {
    type: string;
    queues: number;
    tasks: Progress;
    failed: number;
    work: Progress;
    running: number;
    pending: number;
};

export type TaskQueueTaskEventType = 'enqueued' | 'started' | 'progress' | 'success' | 'failed';

export type TaskQueueTaskEvent = {
    queueName: string;
    queueType: string;
    taskId: string;
    taskName: string;
    taskType: string;
    status: TaskStatus;
    progress: Progress;
    event: TaskQueueTaskEventType;
    error?: unknown;
};

export type TaskQueueRegistryEventType = 'created' | 'destroyed' | 'cleared';

export type TaskQueueRegistryEvent = {
    type: TaskQueueRegistryEventType;
    queueName?: string;
};

export type TaskOptions = {
    id?: string;
    type?: string;
    name?: string;
    progressTotal?: number;
};

export type PendingQueueItem<TResult> = {
    task: Task<any, TResult>;
    resolve: (v: TResult) => void;
    reject: (e: unknown) => void;
};
