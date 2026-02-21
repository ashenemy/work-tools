import { BehaviorSubject, combineLatest, concatMap, debounceTime, finalize, from, Subject, Subscription, tap } from 'rxjs';

import { QueueStatus } from '../../@types';
import { ProgressBarRenderer } from './progress-bar-renderer.class';
import { TaskRunner } from './task-runner.class';
import { Optional } from '@work-tools/ts';
import { BaseLogMessage } from '@work-tools/log-message';
import { TelegramClient } from 'telegram';

export class TasksQueue {
    public static _instance: Optional<TasksQueue> = undefined;

    public static get $(): TasksQueue {
        if (!TasksQueue._instance) {
            TasksQueue._instance = new TasksQueue();
        }

        return TasksQueue._instance;
    }

    public static addTask(task: BaseLogMessage, client: TelegramClient): void {
        TasksQueue.$.addTask(new TaskRunner(task, client));
    }

    private taskSubject = new Subject<TaskRunner>();
    private statusSubject = new BehaviorSubject<QueueStatus>({
        total: 0,
        completed: 0,
        currentTask: null,
    });

    public status$ = this.statusSubject.asObservable();

    private renderer: ProgressBarRenderer;

    constructor() {
        this.renderer = new ProgressBarRenderer();
        this.setupQueueProcessing();

        this.setupAutoRender();
    }

    private setupQueueProcessing(): void {
        this.taskSubject
            .pipe(
                tap(() => this.incrementTotal()),
                concatMap((taskRunner) => this.executeTask(taskRunner)),
            )
            .subscribe();
    }

    public addTask(task: TaskRunner): void {
        this.taskSubject.next(task);
    }

    private incrementTotal(): void {
        const s = this.statusSubject.value;
        this.statusSubject.next({ ...s, total: s.total + 1 });
    }

    private executeTask(taskRunner: TaskRunner) {
        let stepSub: Subscription | null = null;

        // Подписываемся на обновления шагов задачи
        stepSub = taskRunner.currentStep$.subscribe({
            next: (stepEvent) => {
                this.statusSubject.next({
                    ...this.statusSubject.value,
                    currentTask: stepEvent,
                });
            },
            error: (err) => console.error(`[TaskRunner] Ошибка шагов:`, err),
        });

        return from(taskRunner.run()).pipe(
            finalize(() => {
                stepSub?.unsubscribe();
                this.completeTask();
            }),
        );
    }

    private completeTask(): void {
        const s = this.statusSubject.value;
        this.statusSubject.next({
            total: s.total,
            completed: s.completed + 1,
            currentTask: null,
        });
    }

    private setupAutoRender(): void {
        combineLatest([this.statusSubject])
            .pipe(debounceTime(16))
            .subscribe(([status]) => this.renderer.update(status));
    }

    public stop(): void {
        this.renderer.stop();
    }
}
