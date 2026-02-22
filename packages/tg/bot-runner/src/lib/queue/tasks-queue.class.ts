import { BehaviorSubject, concatMap,  finalize, from, Subject, catchError, of, tap } from 'rxjs';

import { QueueStatus } from '../../@types';
import { ProgressBarRenderer } from './progress-bar-renderer.class';
import { TaskRunner } from './task-runner.class';
import { Optional } from '@work-tools/ts';
import { BaseLogMessage } from '@work-tools/log-message';
import { TelegramClient } from 'telegram';
import logSymbols from 'log-symbols';

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

    private renderer: ProgressBarRenderer;

    constructor() {
        this.renderer = ProgressBarRenderer.$;
        this.setupQueueProcessing();
    }

    private setupQueueProcessing(): void {
        this.taskSubject
            .pipe(
                tap(() => this.incrementTotal()),
                concatMap((taskRunner) =>
                    this.executeTask(taskRunner).pipe(
                        catchError((err) => {
                            console.error('Задача упала, но очередь продолжается', err);
                            return of(null);
                        }),
                    ),
                ),
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
        return from(taskRunner.run()).pipe(
            finalize(() => {
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

        // Финальное сообщение о завершении таска
        if (s.completed + 1 === s.total) {
            console.log(' ');
            console.log(' ');
            console.log(`${logSymbols.success} Все задачи в очереди выполнены (${s.completed + 1}/${s.total})`);
        } else {
            console.log(' ');
            console.log(`${logSymbols.info} остаалось задачь (${s.completed + 1}/${s.total})`);
        }
    }

    public stop(): void {
        this.renderer.stop();
    }
}
