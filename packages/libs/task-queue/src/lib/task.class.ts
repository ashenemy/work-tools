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

    protected constructor(payload: TPayload, options: TaskOptions = {}) {
        const total = this._normalizeTotal(options.progressTotal ?? 1);

        this.id = options.id ?? randomUUID();
        this.type = options.type ?? 'default';
        this.name = options.name ?? this.type;
        this.payload = payload;
        this._progressSubject = new BehaviorSubject<Progress>({ total, success: 0 });
        this._statusSubject = new BehaviorSubject<TaskStatus>('pending');
        this.progress$ = this._progressSubject.asObservable();
        this.status$ = this._statusSubject.asObservable();
    }

    public async execute(): Promise<TResult> {
        if (this._started) {
            throw new Error(`Task ${this.id} has already been executed`);
        }

        this._started = true;
        this._statusSubject.next('running');

        try {
            const result = await this.run(this.payload);
            this.completeProgress();
            this._statusSubject.next('success');
            return result;
        } catch (error) {
            this._statusSubject.next('failed');
            throw error;
        }
    }

    public getProgress(): Progress {
        return this._progressSubject.value;
    }

    public getStatus(): TaskStatus {
        return this._statusSubject.value;
    }

    protected setProgress(success: number, total: number = this._progressSubject.value.total): void {
        const normalizedTotal = this._normalizeTotal(total);
        const normalizedSuccess = Math.max(0, Math.min(Math.floor(success), normalizedTotal));

        this._progressSubject.next({
            total: normalizedTotal,
            success: normalizedSuccess,
        });
    }

    protected setProgressTotal(total: number): void {
        this.setProgress(this._progressSubject.value.success, total);
    }

    protected incrementProgress(value = 1): void {
        this.setProgress(this._progressSubject.value.success + Math.floor(value));
    }

    protected completeProgress(): void {
        this.setProgress(this._progressSubject.value.total, this._progressSubject.value.total);
    }

    protected abstract run(payload: TPayload): Promise<TResult>;

    private _normalizeTotal(total: number): number {
        const n = Math.floor(total);
        return Number.isFinite(n) && n > 0 ? n : 1;
    }
}
