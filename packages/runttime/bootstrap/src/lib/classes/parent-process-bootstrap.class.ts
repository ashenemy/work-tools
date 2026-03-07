import type { ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { BootstrapRuntimeMode, ChildAppDefinition, ChildLogLevel, ChildToParentIpcMessage, ParentBootstrapOptions, ParentChildStatus, ParentToChildIpcMessage } from '../../@types';
import { launchChildAppProcess, resolveBootstrapMode } from './child-app-launcher.function';

type ManagedChildProcess = {
    definition: ChildAppDefinition;
    process: ChildProcess;
    mode: BootstrapRuntimeMode;
    runner: ParentChildStatus['runner'];
    restarts: number;
    lastHeartbeatAt: number;
    stopping: boolean;
};

type StopManagedChildOptions = {
    reason?: string;
    forRestart?: boolean;
};

const DEFAULT_HEALTH_CHECK_INTERVAL_MS = 10_000;
const DEFAULT_HEALTH_CHECK_TIMEOUT_MS = 30_000;
const DEFAULT_RESTART_DELAY_MS = 2_000;
const DEFAULT_STOP_TIMEOUT_MS = 8_000;

export class ParentProcessBootstrap {
    private readonly _shutdownSignals: NodeJS.Signals[];
    private readonly _mode: BootstrapRuntimeMode;
    private readonly _childrenByName: Map<string, ChildAppDefinition>;
    private readonly _activeChildren: Map<string, ManagedChildProcess> = new Map();
    private readonly _restartCounters: Map<string, number> = new Map();
    private _healthCheckTimer: NodeJS.Timeout | null = null;
    private _started = false;
    private _stopping = false;

    constructor(private readonly _options: ParentBootstrapOptions) {
        this._mode = resolveBootstrapMode(_options.mode);
        this._shutdownSignals = _options.shutdownSignals ?? ['SIGINT', 'SIGTERM'];
        this._childrenByName = new Map(_options.children.map((child) => [child.name, child]));
    }

    public async run(): Promise<void> {
        await this.start();
        await this.awaitShutdownSignal();
        await this.stop();
    }

    public async start(): Promise<void> {
        if (this._started) {
            return;
        }

        this._started = true;
        this._stopping = false;

        for (const childDefinition of this._childrenByName.values()) {
            if (childDefinition.autoStart === false) {
                continue;
            }

            await this.startChild(childDefinition.name);
        }

        this._startHealthMonitor();
    }

    public async stop(): Promise<void> {
        if (!this._started || this._stopping) {
            return;
        }

        this._stopping = true;
        this._stopHealthMonitor();

        const childNames = Array.from(this._activeChildren.keys());
        for (const childName of childNames) {
            await this.stopChild(childName, 'parent shutdown');
        }

        this._activeChildren.clear();
        this._started = false;
    }

    public listChildren(): ParentChildStatus[] {
        const statuses: ParentChildStatus[] = [];

        for (const [childName] of this._childrenByName.entries()) {
            const managedChild = this._activeChildren.get(childName);
            const runner: ParentChildStatus['runner'] = this._mode === 'production' ? 'node' : 'nx';

            statuses.push({
                name: childName,
                pid: managedChild?.process.pid,
                runner: managedChild?.runner ?? runner,
                mode: managedChild?.mode ?? this._mode,
                restarts: managedChild?.restarts ?? this._restartCounters.get(childName) ?? 0,
                lastHeartbeatAt: managedChild?.lastHeartbeatAt,
                alive: Boolean(managedChild?.process.pid && managedChild.process.exitCode === null && managedChild.process.signalCode === null),
            });
        }

        return statuses;
    }

    public async startChild(childName: string): Promise<ParentChildStatus> {
        const definition = this._resolveChildDefinition(childName);
        const existed = this._activeChildren.get(childName);

        if (existed && existed.process.exitCode === null && existed.process.signalCode === null) {
            return this._toStatus(childName, existed);
        }

        if (existed) {
            this._activeChildren.delete(childName);
        }

        const launch = launchChildAppProcess(definition, this._mode);
        const managedChild: ManagedChildProcess = {
            definition,
            process: launch.child,
            mode: launch.mode,
            runner: launch.runner,
            restarts: this._restartCounters.get(childName) ?? 0,
            lastHeartbeatAt: Date.now(),
            stopping: false,
        };

        this._activeChildren.set(childName, managedChild);
        this._attachChildHandlers(childName, managedChild);
        this._sendToChild(managedChild, {
            type: 'lifecycle:hello',
            sentAt: Date.now(),
            parentPid: process.pid,
        });

        return this._toStatus(childName, managedChild);
    }

    public async stopChild(childName: string, reason?: string): Promise<void> {
        const managedChild = this._activeChildren.get(childName);

        if (!managedChild) {
            return;
        }

        await this._stopManagedChild(childName, managedChild, {
            reason,
        });

        this._activeChildren.delete(childName);
    }

    public async restartChild(childName: string, reason?: string): Promise<ParentChildStatus> {
        const managedChild = this._activeChildren.get(childName);

        if (managedChild) {
            await this._stopManagedChild(childName, managedChild, {
                forRestart: true,
                reason,
            });
            this._activeChildren.delete(childName);
        }

        return await this.startChild(childName);
    }

    public awaitShutdownSignal(): Promise<NodeJS.Signals> {
        return new Promise((resolve) => {
            const handlers = new Map<NodeJS.Signals, () => void>();

            const detach = (): void => {
                for (const [signal, handler] of handlers) {
                    process.off(signal, handler);
                }

                handlers.clear();
            };

            for (const signal of this._shutdownSignals) {
                const handler = (): void => {
                    detach();
                    resolve(signal);
                };

                handlers.set(signal, handler);
                process.once(signal, handler);
            }
        });
    }

    private _attachChildHandlers(childName: string, managedChild: ManagedChildProcess): void {
        managedChild.process.on('message', (message: unknown) => {
            this._handleChildMessage(childName, managedChild, message);
        });

        managedChild.process.on('error', (error: unknown) => {
            console.error(`[parent-bootstrap] Child "${childName}" process error:`, error);
        });

        managedChild.process.once('exit', (code: number | null, signal: NodeJS.Signals | null) => {
            void this._handleChildExit(childName, managedChild, code, signal);
        });
    }

    private _handleChildMessage(childName: string, managedChild: ManagedChildProcess, message: unknown): void {
        const parsedMessage = this._parseChildMessage(message);

        if (!parsedMessage) {
            return;
        }

        if (parsedMessage.type === 'health:pong') {
            managedChild.lastHeartbeatAt = Date.now();
            return;
        }

        if (parsedMessage.type === 'lifecycle:restart-request') {
            void this.restartChild(childName, parsedMessage.reason ?? 'requested by child process');
            return;
        }

        if (parsedMessage.type === 'lifecycle:log') {
            const prefix = `[child:${childName}]`;

            switch (parsedMessage.level) {
                case 'debug':
                case 'info':
                case 'log':
                    console.log(prefix, parsedMessage.message);
                    break;
                case 'warn':
                    console.warn(prefix, parsedMessage.message);
                    break;
                case 'error':
                    console.error(prefix, parsedMessage.message);
                    break;
            }
        }
    }

    private async _handleChildExit(childName: string, managedChild: ManagedChildProcess, code: number | null, signal: NodeJS.Signals | null): Promise<void> {
        this._activeChildren.delete(childName);

        if (this._stopping || managedChild.stopping) {
            return;
        }

        console.warn(`[parent-bootstrap] Child "${childName}" exited. code=${String(code)} signal=${String(signal)}`);

        const restartOnCrash = managedChild.definition.restartOnCrash ?? this._options.restartOnCrash ?? true;

        if (!restartOnCrash) {
            return;
        }

        const nextRestartCount = (this._restartCounters.get(childName) ?? 0) + 1;
        const maxRestarts = managedChild.definition.maxRestarts ?? this._options.maxRestarts;

        if (typeof maxRestarts === 'number' && maxRestarts >= 0 && nextRestartCount > maxRestarts) {
            console.error(`[parent-bootstrap] Child "${childName}" reached max restarts (${maxRestarts}).`);
            return;
        }

        this._restartCounters.set(childName, nextRestartCount);

        const restartDelayMs = managedChild.definition.restartDelayMs ?? this._options.restartDelayMs ?? DEFAULT_RESTART_DELAY_MS;
        await this._sleep(restartDelayMs);

        if (this._stopping) {
            return;
        }

        await this.startChild(childName);
    }

    private _startHealthMonitor(): void {
        if (this._healthCheckTimer) {
            return;
        }

        const intervalMs = this._options.healthCheckIntervalMs ?? DEFAULT_HEALTH_CHECK_INTERVAL_MS;

        this._healthCheckTimer = setInterval(() => {
            void this._checkChildrenHealth();
        }, intervalMs);
    }

    private _stopHealthMonitor(): void {
        if (!this._healthCheckTimer) {
            return;
        }

        clearInterval(this._healthCheckTimer);
        this._healthCheckTimer = null;
    }

    private async _checkChildrenHealth(): Promise<void> {
        if (this._stopping) {
            return;
        }

        const now = Date.now();

        for (const [childName, managedChild] of this._activeChildren.entries()) {
            if (managedChild.stopping) {
                continue;
            }

            const timeoutMs = managedChild.definition.healthCheckTimeoutMs ?? this._options.healthCheckTimeoutMs ?? DEFAULT_HEALTH_CHECK_TIMEOUT_MS;
            const heartbeatAge = now - managedChild.lastHeartbeatAt;

            if (heartbeatAge > timeoutMs) {
                console.warn(`[parent-bootstrap] Child "${childName}" heartbeat timeout (${heartbeatAge}ms). Restarting...`);
                await this.restartChild(childName, 'heartbeat timeout');
                continue;
            }

            this._sendToChild(managedChild, {
                type: 'health:ping',
                sentAt: now,
                requestId: randomUUID(),
            });
        }
    }

    private async _stopManagedChild(childName: string, managedChild: ManagedChildProcess, options: StopManagedChildOptions): Promise<void> {
        if (managedChild.stopping) {
            return;
        }

        managedChild.stopping = true;

        this._sendToChild(managedChild, {
            type: options.forRestart ? 'control:restart' : 'control:shutdown',
            sentAt: Date.now(),
            reason: options.reason,
        });

        const stopTimeoutMs = this._options.stopTimeoutMs ?? DEFAULT_STOP_TIMEOUT_MS;
        const gracefulExit = await this._waitChildExit(managedChild.process, stopTimeoutMs);

        if (gracefulExit) {
            return;
        }

        managedChild.process.kill('SIGTERM');
        const terminated = await this._waitChildExit(managedChild.process, Math.max(500, Math.floor(stopTimeoutMs / 2)));

        if (terminated) {
            return;
        }

        managedChild.process.kill('SIGKILL');
        await this._waitChildExit(managedChild.process, Math.max(500, Math.floor(stopTimeoutMs / 2)));
        console.warn(`[parent-bootstrap] Child "${childName}" was forcefully terminated.`);
    }

    private async _waitChildExit(child: ChildProcess, timeoutMs: number): Promise<boolean> {
        if (child.exitCode !== null || child.signalCode !== null) {
            return true;
        }

        return await new Promise<boolean>((resolve) => {
            let settled = false;
            const timeout = setTimeout(() => {
                if (settled) {
                    return;
                }

                settled = true;
                child.off('exit', onExit);
                resolve(false);
            }, timeoutMs);

            const onExit = (): void => {
                if (settled) {
                    return;
                }

                settled = true;
                clearTimeout(timeout);
                resolve(true);
            };

            child.once('exit', onExit);
        });
    }

    private _toStatus(childName: string, managedChild: ManagedChildProcess): ParentChildStatus {
        return {
            name: childName,
            pid: managedChild.process.pid,
            runner: managedChild.runner,
            mode: managedChild.mode,
            restarts: managedChild.restarts,
            lastHeartbeatAt: managedChild.lastHeartbeatAt,
            alive: managedChild.process.exitCode === null && managedChild.process.signalCode === null,
        };
    }

    private _sendToChild(child: ManagedChildProcess, message: ParentToChildIpcMessage): void {
        if (!child.process.connected) {
            return;
        }

        child.process.send?.(message);
    }

    private _resolveChildDefinition(childName: string): ChildAppDefinition {
        const definition = this._childrenByName.get(childName);

        if (!definition) {
            throw new Error(`Child app "${childName}" not found.`);
        }

        return definition;
    }

    private _parseChildMessage(message: unknown): ChildToParentIpcMessage | null {
        if (!message || typeof message !== 'object') {
            return null;
        }

        const rawMessage = message as Record<string, unknown>;

        if (typeof rawMessage.type !== 'string') {
            return null;
        }

        switch (rawMessage.type) {
            case 'lifecycle:ready':
                return {
                    type: 'lifecycle:ready',
                    sentAt: Number(rawMessage.sentAt ?? Date.now()),
                    appName: String(rawMessage.appName ?? ''),
                    pid: Number(rawMessage.pid ?? 0),
                };
            case 'lifecycle:stopping':
                return {
                    type: 'lifecycle:stopping',
                    sentAt: Number(rawMessage.sentAt ?? Date.now()),
                    appName: String(rawMessage.appName ?? ''),
                    pid: Number(rawMessage.pid ?? 0),
                    reason: typeof rawMessage.reason === 'string' ? rawMessage.reason : undefined,
                };
            case 'lifecycle:restart-request':
                return {
                    type: 'lifecycle:restart-request',
                    sentAt: Number(rawMessage.sentAt ?? Date.now()),
                    appName: String(rawMessage.appName ?? ''),
                    pid: Number(rawMessage.pid ?? 0),
                    reason: typeof rawMessage.reason === 'string' ? rawMessage.reason : undefined,
                };
            case 'health:pong':
                return {
                    type: 'health:pong',
                    sentAt: Number(rawMessage.sentAt ?? Date.now()),
                    appName: String(rawMessage.appName ?? ''),
                    pid: Number(rawMessage.pid ?? 0),
                    uptimeMs: Number(rawMessage.uptimeMs ?? 0),
                    requestId: typeof rawMessage.requestId === 'string' ? rawMessage.requestId : undefined,
                };
            case 'lifecycle:log':
                return {
                    type: 'lifecycle:log',
                    sentAt: Number(rawMessage.sentAt ?? Date.now()),
                    appName: String(rawMessage.appName ?? ''),
                    pid: Number(rawMessage.pid ?? 0),
                    level: this._normalizeLogLevel(rawMessage.level),
                    message: String(rawMessage.message ?? ''),
                };
            default:
                return null;
        }
    }

    private _normalizeLogLevel(level: unknown): ChildLogLevel {
        if (level === 'warn' || level === 'error' || level === 'debug' || level === 'info' || level === 'log') {
            return level;
        }

        return 'log';
    }

    private async _sleep(ms: number): Promise<void> {
        await new Promise<void>((resolve) => {
            setTimeout(resolve, Math.max(0, ms));
        });
    }
}
