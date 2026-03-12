import type { ChildLogLevel, ChildProcessBridgeOptions, ChildToParentIpcMessage, ParentToChildIpcMessage } from '../../@types';

const RESTART_EXIT_CODE = 75;

export class ChildProcessBridge {
    private readonly _appName: string;
    private _started = false;
    private _stopping = false;
    private readonly _messageHandler = (message: unknown): void => {
        void this._handleParentMessage(message);
    };

    constructor(private readonly _options: ChildProcessBridgeOptions = {}) {
        this._appName = _options.appName?.trim() || process.env.APP_NAME || process.title || 'child-app';
    }

    public get enabled(): boolean {
        return typeof process.send === 'function';
    }

    public start(): void {
        if (!this.enabled || this._started) {
            return;
        }

        this._started = true;
        process.on('message', this._messageHandler);
        this._emit({ appName: this._appName, pid: process.pid, sentAt: Date.now(), type: 'lifecycle:ready' });
    }

    public stop(reason?: string): void {
        if (!this.enabled || !this._started) {
            return;
        }

        process.off('message', this._messageHandler);
        this._started = false;
        this._emit({ appName: this._appName, pid: process.pid, reason, sentAt: Date.now(), type: 'lifecycle:stopping' });
    }

    public requestRestart(reason?: string): void {
        this._emit({ appName: this._appName, pid: process.pid, reason, sentAt: Date.now(), type: 'lifecycle:restart-request' });
    }

    public sendLog(level: ChildLogLevel, message: string): void {
        this._emit({ appName: this._appName, level, message, pid: process.pid, sentAt: Date.now(), type: 'lifecycle:log' });
    }

    private async _handleParentMessage(message: unknown): Promise<void> {
        const parsedMessage = this._parseParentMessage(message);

        if (!parsedMessage) {
            return;
        }

        if (this._options.onParentMessage) {
            await this._options.onParentMessage(parsedMessage);
        }

        switch (parsedMessage.type) {
            case 'lifecycle:hello':
                this._emit({ appName: this._appName, pid: process.pid, sentAt: Date.now(), type: 'lifecycle:ready' });
                break;
            case 'health:ping':
                this._emit({
                    appName: this._appName,
                    pid: process.pid,
                    requestId: parsedMessage.requestId,
                    sentAt: Date.now(),
                    type: 'health:pong',
                    uptimeMs: Math.floor(process.uptime() * 1000),
                });
                break;
            case 'control:shutdown':
                await this._shutdown(parsedMessage.reason, 0);
                break;
            case 'control:restart':
                await this._restart(parsedMessage.reason);
                break;
        }
    }

    private async _shutdown(reason: string | undefined, exitCode: number): Promise<void> {
        if (this._stopping) {
            return;
        }

        this._stopping = true;

        if (this._options.onShutdown) {
            await this._options.onShutdown(reason);
        }

        this.stop(reason);
        process.exit(exitCode);
    }

    private async _restart(reason: string | undefined): Promise<void> {
        if (this._stopping) {
            return;
        }

        this._stopping = true;

        if (this._options.onRestart) {
            await this._options.onRestart(reason);
        } else if (this._options.onShutdown) {
            await this._options.onShutdown(reason);
        }

        this.stop(reason ?? 'restart');
        process.exit(RESTART_EXIT_CODE);
    }

    private _emit(message: ChildToParentIpcMessage): void {
        if (!this.enabled) {
            return;
        }

        process.send?.(message);
    }

    private _parseParentMessage(message: unknown): ParentToChildIpcMessage | null {
        if (!message || typeof message !== 'object') {
            return null;
        }

        const rawMessage = message as Record<string, unknown>;

        if (typeof rawMessage.type !== 'string') {
            return null;
        }

        if (rawMessage.type === 'lifecycle:hello') {
            return {
                parentPid: Number(rawMessage.parentPid ?? 0),
                sentAt: Number(rawMessage.sentAt ?? Date.now()),
                type: 'lifecycle:hello',
            };
        }

        if (rawMessage.type === 'health:ping') {
            return {
                requestId: typeof rawMessage.requestId === 'string' ? rawMessage.requestId : '',
                sentAt: Number(rawMessage.sentAt ?? Date.now()),
                type: 'health:ping',
            };
        }

        if (rawMessage.type === 'control:shutdown') {
            return {
                reason: typeof rawMessage.reason === 'string' ? rawMessage.reason : undefined,
                sentAt: Number(rawMessage.sentAt ?? Date.now()),
                type: 'control:shutdown',
            };
        }

        if (rawMessage.type === 'control:restart') {
            return {
                reason: typeof rawMessage.reason === 'string' ? rawMessage.reason : undefined,
                sentAt: Number(rawMessage.sentAt ?? Date.now()),
                type: 'control:restart',
            };
        }

        return null;
    }
}
