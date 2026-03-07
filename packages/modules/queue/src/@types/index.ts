import type { BrokerModuleOptions } from '@work-tools/broker-service';
import type { JsonLike } from '@work-tools/ts';
import type { Progress, TaskQueueOptions, TaskQueueProgressEvent, TaskQueueRegistryEvent, TaskQueueTaskEvent, TaskStatus } from '@work-tools/taskqueue';
import type { QUEUE_EVENT_SUBJECTS } from '../lib/queue.constants';

export type QueueTaskHandlerContext = {
    signal: AbortSignal;
    taskId: string;
    queueName: string;
    queueType: string;
    setProgress: (success: number, total?: number) => void;
    setProgressTotal: (total: number) => void;
    incrementProgress: (value?: number) => void;
    getProgress: () => Progress;
};

export type QueueTaskHandler<TPayload extends JsonLike = JsonLike, TResult = unknown> = (payload: TPayload, context: QueueTaskHandlerContext) => Promise<TResult>;

export type QueueTaskHandlerRegistration<TPayload extends JsonLike = JsonLike, TResult = unknown> = {
    taskType: string;
    handler: QueueTaskHandler<TPayload, TResult>;
};

export type QueueCreateQueueInput = {
    name: string;
    options: TaskQueueOptions;
};

export type QueueTaskDescriptor<TPayload extends JsonLike = JsonLike> = {
    queueName: string;
    queueOptions?: TaskQueueOptions;
    taskType: string;
    taskName?: string;
    payload: TPayload;
    progressTotal?: number;
    taskId?: string;
};

export type QueueTaskErrorSnapshot = {
    name?: string;
    message: string;
    stack?: string;
};

export type QueueTaskStateRecord<TPayload extends JsonLike = JsonLike> = {
    id: string;
    queueName: string;
    queueType: string;
    queueConcurrency: number;
    taskType: string;
    taskName: string;
    payload: TPayload;
    progress: Progress;
    status: TaskStatus;
    attempts: number;
    createdAt: string;
    updatedAt: string;
    lastError?: QueueTaskErrorSnapshot;
};

export type QueueStateQueueRecord = {
    name: string;
    options: TaskQueueOptions;
    createdAt: string;
    updatedAt: string;
};

export type QueueStateSnapshot = {
    version: number;
    updatedAt: string;
    queues: Record<string, QueueStateQueueRecord>;
    tasks: Record<string, QueueTaskStateRecord>;
};

export type QueueEventSubjects = {
    taskChanged: string;
    taskError: string;
    queueProgress: string;
    queueRegistry: string;
    restoreSummary: string;
};

export type QueueModuleOptions = {
    broker?: BrokerModuleOptions;
    autoRestore?: boolean;
    stateFilePath?: string;
    stateStore?: QueueStateStore;
    eventSubjects?: Partial<QueueEventSubjects>;
    initialQueues?: QueueCreateQueueInput[];
    taskHandlers?: QueueTaskHandlerRegistration[];
};

export type QueueRestoreSummary = {
    total: number;
    restored: number;
    failed: number;
};

export type QueueTaskChangedEvent = {
    event: TaskQueueTaskEvent;
    state?: QueueTaskStateRecord;
};

export type QueueProgressChangedEvent = {
    event: TaskQueueProgressEvent;
};

export type QueueRegistryChangedEvent = {
    event: TaskQueueRegistryEvent;
};

export type QueueRestoreSummaryEvent = {
    summary: QueueRestoreSummary;
};

export interface QueueStateStore {
    load(): Promise<QueueStateSnapshot>;
    save(state: QueueStateSnapshot): Promise<void>;
}

export type QueueResolvedOptions = {
    autoRestore: boolean;
    eventSubjects: QueueEventSubjects;
    initialQueues: QueueCreateQueueInput[];
    taskHandlers: QueueTaskHandlerRegistration[];
    stateStore?: QueueStateStore;
    stateFilePath: string;
    broker: BrokerModuleOptions;
};

export type QueueEventSubjectKeys = keyof typeof QUEUE_EVENT_SUBJECTS;
