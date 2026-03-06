import { Observable } from 'rxjs';
import { Progress, TaskRunnerEvent, TaskRunnerEventType, TaskStatus } from '../@types';
import { Task } from './task.class';

export class TaskRunner {
    public run<TPayload, TResult>(task: Task<TPayload, TResult>): Observable<TaskRunnerEvent<TResult>> {
        return new Observable<TaskRunnerEvent<TResult>>((subscriber) => {
            const progressSubscription = task.progress$.subscribe((progress) => {
                this._emitEvent(subscriber, task, 'progress', task.getStatus(), progress);
            });

            const statusSubscription = task.status$.subscribe((status) => {
                if (status === 'running') {
                    this._emitEvent(subscriber, task, 'started', status, task.getProgress());
                }
            });

            void task
                .execute()
                .then((result) => {
                    this._emitEvent(subscriber, task, 'success', task.getStatus(), task.getProgress(), result);
                    subscriber.complete();
                })
                .catch((error: unknown) => {
                    this._emitEvent(subscriber, task, 'failed', 'failed', task.getProgress(), undefined, error);
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

    private _emitEvent<TResult>(subscriber: { closed: boolean; next: (value: TaskRunnerEvent<TResult>) => void }, task: Task<unknown, TResult>, event: TaskRunnerEventType, status: TaskStatus, progress: Progress, result?: TResult, error?: unknown): void {
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
}
