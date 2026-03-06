import type { Task } from '../lib/task.class';

export type Progress = {
    total: number;
    success: number;
};

export type CalculatedProgress = Progress & {
    percent: number;
    speed: number;
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

export type TaskQueueProgressEvent = {
    queueName: string;
    queueType: string;
    stats: TaskQueueStats;
};

export type PersistedTaskDescriptor<TResult = unknown> = {
    queueName: string;
    queueOptions?: TaskQueueOptions;
    task: Task<any, TResult>;
};

export type RestoreTasksError<TRecord = unknown> = {
    record: TRecord;
    error: unknown;
};

export type RestoreTasksResult<TRecord = unknown> = {
    total: number;
    enqueued: number;
    failed: number;
    errors: Array<RestoreTasksError<TRecord>>;
};

export type TaskOptions = {
    id?: string;
    type?: string;
    name?: string;
    progressTotal?: number;
};

export type PendingQueueItem<TResult> = {
    task: Task<any, TResult>;
    resolve: (value: TResult) => void;
    reject: (error: unknown) => void;
};

export type TaskRunnerEventType = 'started' | 'progress' | 'success' | 'failed';

export type TaskRunnerEvent<TResult = unknown> = {
    taskId: string;
    taskName: string;
    taskType: string;
    status: TaskStatus;
    progress: CalculatedProgress;
    event: TaskRunnerEventType;
    result?: TResult;
    error?: unknown;
};
