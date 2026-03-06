import { randomUUID } from 'node:crypto';
import { BehaviorSubject, Observable } from 'rxjs';
import { Progress, TaskOptions, TaskStatus } from '../@types';

export abstract class Task<TPayload, TResult> {
    public readonly id: string;
    public readonly type: string;
    public readonly name: string;
    public readonly payload: TPayload;

    public readonly progress$: Observable<Progress>;
    public readonly status$: Observable<TaskStatus>;

    private readonly _progressSubject: BehaviorSubject<Progress>;
    private readonly _statusSubject: BehaviorSubject<TaskStatus>;
    private readonly _abortController: AbortController = new AbortController();
    private _started = false;

    protected constructor(payload: TPayload, options: TaskOptions = {}) {
        this.payload = payload;
        this.id = options.id ?? randomUUID();
        this.type = options.type ?? 'default';
        this.name = options.name ?? this.constructor.name;

        const normalizedTotal = this._normalizeTotal(options.progressTotal ?? 0, 0);
        this._progressSubject = new BehaviorSubject<Progress>({
            total: normalizedTotal,
            success: 0,
        });
        this._statusSubject = new BehaviorSubject<TaskStatus>('pending');

        this.progress$ = this._progressSubject.asObservable();
        this.status$ = this._statusSubject.asObservable();
    }

    public get signal(): AbortSignal {
        return this._abortController.signal;
    }

    public cancel(reason: unknown = new Error(`Task "${this.id}" was aborted.`)): void {
        if (!this._abortController.signal.aborted) {
            this._abortController.abort(reason);
        }
    }

    public async execute(): Promise<TResult> {
        if (this._started) {
            throw new Error(`Task "${this.id}" has already started.`);
        }

        if (this.signal.aborted) {
            const abortError = this._resolveAbortReason();
            this._statusSubject.next('failed');
            this._statusSubject.complete();
            this._progressSubject.complete();
            throw abortError;
        }

        this._started = true;
        this._statusSubject.next('running');

        try {
            const result = await this.run(this.payload, this.signal);
            this.completeProgress();
            this._statusSubject.next('success');
            this._statusSubject.complete();
            this._progressSubject.complete();
            return result;
        } catch (error: unknown) {
            const resolvedError = this.signal.aborted ? this._resolveAbortReason(error) : error;
            this._statusSubject.next('failed');
            this._statusSubject.complete();
            this._progressSubject.complete();
            throw resolvedError;
        }
    }

    public getProgress(): Progress {
        return this._progressSubject.value;
    }

    public getStatus(): TaskStatus {
        return this._statusSubject.value;
    }

    protected setProgress(success: number, total: number = this.getProgress().total): void {
        const normalizedTotal = this._normalizeTotal(total, success);
        const normalizedSuccess = this._normalizeSuccess(success, normalizedTotal);
        this._progressSubject.next({
            total: normalizedTotal,
            success: normalizedSuccess,
        });
    }

    protected setProgressTotal(total: number): void {
        this.setProgress(this.getProgress().success, total);
    }

    protected incrementProgress(value: number = 1): void {
        const step = Number.isFinite(value) ? Math.max(0, value) : 0;
        this.setProgress(this.getProgress().success + step);
    }

    protected completeProgress(): void {
        const current = this.getProgress();
        const total = this._normalizeTotal(current.total, current.success);
        this.setProgress(total, total);
    }

    protected abstract run(payload: TPayload, signal: AbortSignal): Promise<TResult>;

    private _normalizeTotal(total: number, success: number): number {
        const normalizedTotal = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
        const normalizedSuccess = Number.isFinite(success) ? Math.max(0, Math.floor(success)) : 0;
        return Math.max(normalizedTotal, normalizedSuccess);
    }

    private _normalizeSuccess(success: number, total: number): number {
        if (!Number.isFinite(success)) {
            return 0;
        }

        return Math.min(Math.max(0, Math.floor(success)), total);
    }

    private _resolveAbortReason(fallback?: unknown): unknown {
        if (this._abortController.signal.reason !== undefined) {
            return this._abortController.signal.reason;
        }

        if (fallback !== undefined) {
            return fallback;
        }

        return new Error(`Task "${this.id}" was aborted.`);
    }
}
