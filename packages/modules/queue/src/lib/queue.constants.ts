export const QUEUE_MODULE_OPTIONS = Symbol('QUEUE_MODULE_OPTIONS');
export const QUEUE_STATE_STORE = Symbol('QUEUE_STATE_STORE');

export const QUEUE_SNAPSHOT_VERSION = 1;
export const QUEUE_DEFAULT_STORAGE_FILE_PATH = 'storage/queue/queue-state.json';

export const QUEUE_EVENT_SUBJECTS = {
    taskChanged: 'queue.task.changed',
    taskError: 'queue.task.error',
    queueProgress: 'queue.progress.changed',
    queueRegistry: 'queue.registry.changed',
    restoreSummary: 'queue.restore.summary',
} as const;
