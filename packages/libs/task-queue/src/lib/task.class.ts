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
    private _started = false;
    private _startedAtMs?: number;

    protected constructor(payload: TPayload, options: TaskOptions = {}) {
        this.payload = payload;
        this.id = options.id ?? randomUUID();
        this.type = options.type ?? 'default';
        this.name = options.name ?? this.constructor.name;

        const normalizedTotal = this._normalizeTotal(options.progressTotal ?? 0, 0);
        this._progressSubject = new BehaviorSubject<Progress>(this._createProgressSnapshot(0, normalizedTotal));
        this._statusSubject = new BehaviorSubject<TaskStatus>('pending');

        this.progress$ = this._progressSubject.asObservable();
        this.status$ = this._statusSubject.asObservable();
    }

    public async execute(): Promise<TResult> {
        if (this._started) {
            throw new Error(`Task "${this.id}" has already started.`);
        }

        this._started = true;
        this._startedAtMs = Date.now();
        this._statusSubject.next('running');

        try {
            const result = await this.run(this.payload);
            this.completeProgress();
            this._statusSubject.next('success');
            this._statusSubject.complete();
            this._progressSubject.complete();
            return result;
        } catch (error: unknown) {
            this._statusSubject.next('failed');
            this._statusSubject.complete();
            this._progressSubject.complete();
            throw error;
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
        this._progressSubject.next(this._createProgressSnapshot(normalizedSuccess, normalizedTotal));
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

    protected abstract run(payload: TPayload): Promise<TResult>;

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

    private _createProgressSnapshot(success: number, total: number): Progress {
        const percent = total <= 0 ? 0 : Number(((success / total) * 100).toFixed(2));
        const speed = this._resolveSpeed(success);
        return {
            total,
            success,
            percent,
            speed,
        };
    }

    private _resolveSpeed(success: number): number {
        if (this._startedAtMs === undefined) {
            return 0;
        }

        const elapsedSeconds = (Date.now() - this._startedAtMs) / 1000;
        if (elapsedSeconds <= 0) {
            return 0;
        }

        return Number((success / elapsedSeconds).toFixed(2));
    }
}
