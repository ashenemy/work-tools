import blessed, { Widgets } from '@unblessed/blessed';
import { Progress, TaskQueue, TaskQueueFactory, TaskQueueTaskEvent } from '@work-tools/taskqueue';
import { Subscription } from 'rxjs';
import { ConsoleMethod, InternalOptions, QueueColumnState, QueueColumnWidgets, QueueTaskState, TaskQueueScreenOptions } from '../@types';
import { DEFAULT_OPTIONS } from './options.constants';

export class TaskQueueProgressScreen {
    private readonly _options: InternalOptions;
    private readonly _screen: Widgets.Screen;
    private readonly _emptyState: Widgets.BoxElement;
    private readonly _queues = new Map<string, QueueColumnState>();
    private readonly _consoleOriginals = new Map<ConsoleMethod, unknown>();

    private _factorySubscription: Subscription = Subscription.EMPTY;
    private _taskQueueCreatedSubscription: Subscription = Subscription.EMPTY;
    private _renderTimer: NodeJS.Timeout | undefined = undefined;
    private _destroyed = false;

    constructor(options: TaskQueueScreenOptions = {}) {
        this._options = { ...DEFAULT_OPTIONS, ...options };
        this._screen = blessed.screen({
            smartCSR: true,
            fullUnicode: true,
            autoPadding: false,
            title: 'Work Tools Queue Progress',
        });

        this._emptyState = blessed.box({
            parent: this._screen,
            top: 'center',
            left: 'center',
            width: 'shrink',
            height: 1,
            tags: false,
            content: 'Queue monitor is waiting for queues...',
            style: { fg: 'gray' },
        });

        this._bindScreenKeys();
        this._bindScreenResize();

        if (this._options.blockConsoleOutput) {
            this._blockConsoleOutput();
        }

        if (this._options.autoAttachFactoryQueues) {
            this._attachFactoryQueues();
        }

        this._taskQueueCreatedSubscription = TaskQueue.created$.subscribe((queue) => {
            this.attachQueue(queue);
        });

        this.render();
    }

    public attachQueue(queue: TaskQueue): void {
        if (this._destroyed || this._queues.has(queue.name)) {
            return;
        }

        const widgets = this._createQueueWidgets(queue.name);
        const state: QueueColumnState = {
            queue,
            widgets,
            stats: queue.getStats(),
            tasksOrder: [],
            tasksMap: new Map<string, QueueTaskState>(),
            errors: [],
            statsSubscription: Subscription.EMPTY,
            taskEventsSubscription: Subscription.EMPTY,
        };

        state.statsSubscription = queue.stats$.subscribe((stats) => {
            state.stats = stats;
            this._scheduleRender();
        });

        state.taskEventsSubscription = queue.taskEvents$.subscribe((event) => {
            this._applyTaskEvent(state, event);
            this._scheduleRender();
        });

        this._queues.set(queue.name, state);
        this._layout();
        this._scheduleRender();
    }

    public detachQueue(queueName: string): void {
        const state = this._queues.get(queueName);

        if (!state) {
            return;
        }

        state.statsSubscription.unsubscribe();
        state.taskEventsSubscription.unsubscribe();
        state.widgets.root.destroy();
        this._queues.delete(queueName);
        this._layout();
        this._scheduleRender();
    }

    public render(): void {
        if (this._destroyed) {
            return;
        }

        const queueStates = [...this._queues.values()];
        this._emptyState.hidden = queueStates.length > 0;

        for (const state of queueStates) {
            this._renderQueue(state);
        }

        this._screen.render();
    }

    public destroy(): void {
        if (this._destroyed) {
            return;
        }

        this._destroyed = true;

        if (this._renderTimer) {
            clearTimeout(this._renderTimer);
            this._renderTimer = undefined;
        }

        this._factorySubscription.unsubscribe();
        this._taskQueueCreatedSubscription.unsubscribe();

        for (const state of this._queues.values()) {
            state.statsSubscription.unsubscribe();
            state.taskEventsSubscription.unsubscribe();
        }

        this._queues.clear();
        this._restoreConsoleOutput();
        this._screen.destroy();
    }

    private _bindScreenKeys(): void {
        this._screen.key(['q', 'escape'], () => {
            this.destroy();
        });

        this._screen.key(['C-c'], () => {
            this.destroy();
            process.kill(process.pid, 'SIGINT');
        });
    }

    private _bindScreenResize(): void {
        this._screen.on('resize', () => {
            this._layout();
            this._scheduleRender();
        });
    }

    private _attachFactoryQueues(): void {
        for (const queue of TaskQueueFactory.list()) {
            this.attachQueue(queue);
        }

        this._factorySubscription = TaskQueueFactory.registryEvents$.subscribe((event) => {
            if (event.type === 'created' && event.queueName) {
                const queue = TaskQueueFactory.get(event.queueName);

                if (queue) {
                    this.attachQueue(queue);
                }
                return;
            }

            if (event.type === 'destroyed' && event.queueName) {
                this.detachQueue(event.queueName);
                return;
            }

            if (event.type === 'cleared') {
                for (const name of [...this._queues.keys()]) {
                    this.detachQueue(name);
                }
            }
        });
    }

    private _createQueueWidgets(queueName: string): QueueColumnWidgets {
        const root = blessed.box({
            parent: this._screen,
            top: 0,
            left: 0,
            width: 1,
            height: 1,
            border: 'line',
            tags: false,
            label: ` ${queueName} `,
            style: {
                border: { fg: 'gray' },
            },
        });

        const header = blessed.box({
            parent: root,
            top: 0,
            left: 1,
            right: 1,
            height: 1,
            tags: false,
            style: { fg: 'white', bold: true },
        });

        const tasks = blessed.box({
            parent: root,
            top: 1,
            left: 1,
            right: 1,
            height: 1,
            tags: false,
            scrollable: true,
            alwaysScroll: true,
            mouse: true,
            keys: true,
            vi: true,
            scrollbar: {
                ch: ' ',
                bg: 'gray',
            },
            style: {
                fg: 'white',
                scrollbar: { bg: 'gray' },
            },
        });

        const errors = blessed.box({
            parent: root,
            top: 2,
            left: 1,
            right: 1,
            height: 1,
            tags: false,
            scrollable: true,
            alwaysScroll: true,
            mouse: true,
            keys: true,
            vi: true,
            scrollbar: {
                ch: ' ',
                bg: 'red',
            },
            style: {
                fg: 'red',
                scrollbar: { bg: 'red' },
            },
        });

        return { root, header, tasks, errors };
    }

    private _layout(): void {
        const columns = [...this._queues.values()];
        const count = columns.length;

        if (count === 0) {
            this._emptyState.hidden = false;
            return;
        }

        this._emptyState.hidden = true;

        const screenWidth = this._toInt(this._screen.width, process.stdout.columns ?? 80);
        const screenHeight = this._toInt(this._screen.height, process.stdout.rows ?? 24);
        const baseWidth = Math.max(1, Math.floor(screenWidth / count));

        let left = 0;

        for (let index = 0; index < columns.length; index += 1) {
            const state = columns[index];
            const isLast = index === columns.length - 1;
            const width = isLast ? Math.max(1, screenWidth - left) : baseWidth;
            const rootHeight = Math.max(5, screenHeight);

            state.widgets.root.left = left;
            state.widgets.root.top = 0;
            state.widgets.root.width = width;
            state.widgets.root.height = rootHeight;

            const innerHeight = Math.max(3, rootHeight - 2);
            const tasksHeight = Math.max(1, Math.floor(innerHeight * 0.65));
            const errorsHeight = Math.max(1, innerHeight - 1 - tasksHeight);

            state.widgets.header.top = 0;
            state.widgets.header.height = 1;
            state.widgets.tasks.top = 1;
            state.widgets.tasks.height = tasksHeight;
            state.widgets.errors.top = 1 + tasksHeight;
            state.widgets.errors.height = errorsHeight;

            left += width;
        }
    }

    private _renderQueue(state: QueueColumnState): void {
        const width = this._toInt(state.widgets.root.width, 20);
        const innerWidth = Math.max(10, width - 2);

        state.widgets.header.setContent(this._renderHeaderLine(state, innerWidth));

        const taskIds = state.tasksOrder.slice(-this._options.maxTaskLines);
        const taskLines = taskIds.map((taskId) => {
            const task = state.tasksMap.get(taskId);
            return task ? this._renderTaskLine(task, innerWidth) : '';
        });

        state.widgets.tasks.setContent(taskLines.join('\n'));
        state.widgets.tasks.setScroll?.(taskLines.length);

        const errorLines = state.errors.slice(-this._options.maxErrorLines).map((line) => this._fit(line, innerWidth));
        state.widgets.errors.setContent(errorLines.join('\n'));
        state.widgets.errors.setScroll?.(errorLines.length);
    }

    private _renderHeaderLine(state: QueueColumnState, width: number): string {
        const completed = state.stats.work.success;
        const total = state.stats.work.total;
        const percent = this._percent(completed, total);
        const barWidth = Math.max(8, Math.min(24, width - 28));
        const bar = this._bar(completed, total, barWidth);

        const line = `${state.queue.name} ${bar} ${percent.toString().padStart(3, ' ')}% ${state.stats.success}/${state.stats.total}`;
        return this._fit(line, width);
    }

    private _renderTaskLine(task: QueueTaskState, width: number): string {
        const percent = this._percent(task.progress.success, task.progress.total);
        const barWidth = Math.max(8, Math.min(24, width - 24));
        const bar = this._bar(task.progress.success, task.progress.total, barWidth);
        const symbol = this._statusIcon(task.status);
        const nameMax = Math.max(6, width - (barWidth + 12));
        const name = this._truncate(task.name, nameMax);
        const line = `${symbol} ${name} ${bar} ${percent.toString().padStart(3, ' ')}%`;
        return this._fit(line, width);
    }

    private _applyTaskEvent(state: QueueColumnState, event: TaskQueueTaskEvent): void {
        const progress = this._normalizeProgress(event.progress);
        const current = state.tasksMap.get(event.taskId) ?? {
            id: event.taskId,
            name: event.taskName,
            type: event.taskType,
            progress,
            status: event.status,
            error: undefined,
        };

        current.name = event.taskName;
        current.type = event.taskType;
        current.progress = progress;
        current.status = event.status;

        if (!state.tasksMap.has(event.taskId)) {
            state.tasksOrder.push(event.taskId);
        }

        if (event.event === 'failed') {
            const errorMessage = this._errorMessage(event.error);
            current.error = errorMessage;
            state.errors.push(`[x] ${event.taskName}: ${errorMessage}`);
        }

        state.tasksMap.set(event.taskId, current);

        if (state.tasksOrder.length > this._options.maxTaskLines * 4) {
            const overflow = state.tasksOrder.length - this._options.maxTaskLines * 4;
            const removed = state.tasksOrder.splice(0, overflow);

            for (const taskId of removed) {
                state.tasksMap.delete(taskId);
            }
        }

        if (state.errors.length > this._options.maxErrorLines * 4) {
            state.errors.splice(0, state.errors.length - this._options.maxErrorLines * 4);
        }
    }

    private _bar(success: number, total: number, width: number): string {
        const innerWidth = Math.max(1, width - 2);
        const ratio = total > 0 ? Math.min(1, Math.max(0, success / total)) : 0;
        const filled = Math.round(innerWidth * ratio);
        const empty = innerWidth - filled;
        return `[${'='.repeat(filled)}${' '.repeat(empty)}]`;
    }

    private _statusIcon(status: TaskQueueTaskEvent['status']): string {
        if (status === 'success') return 'v';
        if (status === 'failed') return 'x';
        if (status === 'running') return '>';
        return '.';
    }

    private _percent(success: number, total: number): number {
        if (total <= 0) {
            return 0;
        }

        const value = Math.floor((success / total) * 100);
        return Math.min(100, Math.max(0, value));
    }

    private _normalizeProgress(progress: Progress): Progress {
        const total = Number.isFinite(progress.total) && progress.total > 0 ? Math.floor(progress.total) : 1;
        const success = Number.isFinite(progress.success) ? Math.floor(progress.success) : 0;
        return {
            total,
            success: Math.min(Math.max(0, success), total),
        };
    }

    private _truncate(value: string, maxLength: number): string {
        if (maxLength <= 0) {
            return '';
        }

        if (value.length <= maxLength) {
            return value;
        }

        if (maxLength <= 1) {
            return value.slice(0, maxLength);
        }

        return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
    }

    private _fit(value: string, width: number): string {
        const trimmed = value.replace(/\r?\n/g, ' ');
        return this._truncate(trimmed, width);
    }

    private _errorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message || error.name;
        }

        if (typeof error === 'string') {
            return error;
        }

        try {
            return JSON.stringify(error);
        } catch {
            return String(error);
        }
    }

    private _scheduleRender(): void {
        if (this._destroyed || this._renderTimer) {
            return;
        }

        this._renderTimer = setTimeout(() => {
            this._renderTimer = undefined;
            this.render();
        }, this._options.renderThrottleMs);
    }

    private _blockConsoleOutput(): void {
        const methods: ConsoleMethod[] = ['log', 'info', 'warn', 'error', 'debug', 'trace', 'dir', 'table'];

        for (const method of methods) {
            if (this._consoleOriginals.has(method)) {
                continue;
            }

            this._consoleOriginals.set(method, console[method]);
            (console as Record<ConsoleMethod, unknown>)[method] = () => undefined;
        }
    }

    private _restoreConsoleOutput(): void {
        for (const [method, fn] of this._consoleOriginals.entries()) {
            (console as Record<ConsoleMethod, unknown>)[method] = fn;
        }

        this._consoleOriginals.clear();
    }

    private _toInt(value: number | string, fallback: number): number {
        const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    }
}
