import { Widgets } from '@unblessed/blessed';
import { Subscription } from 'rxjs';
import { Progress, TaskQueue, TaskQueueStats, TaskQueueTaskEvent } from '@work-tools/taskqueue';

export type TaskQueueScreenOptions = {
    blockConsoleOutput?: boolean;
    autoAttachFactoryQueues?: boolean;
    renderThrottleMs?: number;
    maxTaskLines?: number;
    maxErrorLines?: number;
};

export type QueueTaskState = {
    id: string;
    name: string;
    type: string;
    progress: Progress;
    status: TaskQueueTaskEvent['status'];
    error?: string;
};

export type QueueColumnWidgets = {
    root: Widgets.BoxElement;
    header: Widgets.BoxElement;
    tasks: Widgets.BoxElement;
    errors: Widgets.BoxElement;
};

export type QueueColumnState = {
    queue: TaskQueue;
    widgets: QueueColumnWidgets;
    stats: TaskQueueStats;
    tasksOrder: string[];
    tasksMap: Map<string, QueueTaskState>;
    errors: string[];
    statsSubscription: Subscription;
    taskEventsSubscription: Subscription;
};

export type InternalOptions = Required<TaskQueueScreenOptions>;

export type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'trace' | 'dir' | 'table';
