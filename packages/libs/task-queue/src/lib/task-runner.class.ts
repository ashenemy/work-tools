import { Observable } from 'rxjs';
import { CalculatedProgress, Progress, TaskRunnerEvent, TaskRunnerEventType, TaskStatus } from '../@types';
import { Task } from './task.class';

export class TaskRunner {
    public run<TPayload, TResult>(task: Task<TPayload, TResult>): Observable<TaskRunnerEvent<TResult>> {
        return new Observable<TaskRunnerEvent<TResult>>((subscriber) => {
            let startedAtMs = 0;
            let isStarted = false;

            const progressSubscription = task.progress$.subscribe((progress) => {
                if (isStarted) {
                    this._emitEvent(subscriber, task, 'progress', task.getStatus(), this._resolveProgress(progress, startedAtMs, isStarted));
                }
            });

            const statusSubscription = task.status$.subscribe((status) => {
                if (status === 'running' && !isStarted) {
                    isStarted = true;
                    startedAtMs = Date.now();
                    this._emitEvent(subscriber, task, 'started', 'running', this._resolveProgress(task.getProgress(), startedAtMs, isStarted));
                }
            });

            void task
                .execute()
                .then((result) => {
                    this._emitEvent(subscriber, task, 'success', task.getStatus(), this._resolveProgress(task.getProgress(), startedAtMs, isStarted), result);
                    subscriber.complete();
                })
                .catch((error: unknown) => {
                    this._emitEvent(subscriber, task, 'failed', 'failed', this._resolveProgress(task.getProgress(), startedAtMs, isStarted), undefined, error);
                    subscriber.error(error);
                })
                .finally(() => {
                    progressSubscription.unsubscribe();
                    statusSubscription.unsubscribe();
                });

            return () => {
                progressSubscription.unsubscribe();
                statusSubscription.unsubscribe();
            };
        });
    }

    private _emitEvent<TResult>(
        subscriber: { closed: boolean; next: (value: TaskRunnerEvent<TResult>) => void },
        task: Task<unknown, TResult>,
        event: TaskRunnerEventType,
        status: TaskStatus,
        progress: CalculatedProgress,
        result?: TResult,
        error?: unknown,
    ): void {
        if (subscriber.closed) {
            return;
        }

        const payload: TaskRunnerEvent<TResult> = {
            taskId: task.id,
            taskName: task.name,
            taskType: task.type,
            status,
            progress,
            event,
        };

        if (result !== undefined) {
            payload.result = result;
        }

        if (error !== undefined) {
            payload.error = error;
        }

        subscriber.next(payload);
    }

    private _resolveProgress(progress: Progress, startedAtMs: number, isStarted: boolean): CalculatedProgress {
        const total = Math.max(0, Math.floor(progress.total));
        const success = Math.min(Math.max(0, Math.floor(progress.success)), total);
        const percent = total <= 0 ? 0 : Number(((success / total) * 100).toFixed(2));

        if (!isStarted || startedAtMs <= 0) {
            return {
                total,
                success,
                percent,
                speed: 0,
            };
        }

        const elapsedSeconds = (Date.now() - startedAtMs) / 1000;
        const speed = elapsedSeconds <= 0 ? 0 : Number((success / elapsedSeconds).toFixed(2));

        return {
            total,
            success,
            percent,
            speed,
        };
    }
}
