import type { ModuleMetadata, Type } from '@nestjs/common';
import type { NestApplicationContextOptions } from '@nestjs/common/interfaces/nest-application-context-options.interface';
import type { ChildProcess } from 'node:child_process';

export type ConsoleAppModule = Type<unknown>;
export type BootstrapImportModule = NonNullable<ModuleMetadata['imports']>[number];

export type ConsoleBootstrapNatsOptions = {
    enabled?: boolean;
    servers?: string[];
    queue?: string;
    name?: string;
};

export type ConsoleBootstrapOptions = NestApplicationContextOptions & {
    shutdownSignals?: NodeJS.Signals[];
    nats?: ConsoleBootstrapNatsOptions;
};

export type BootstrapRuntimeMode = 'development' | 'production';
export type ChildAppRunner = 'node' | 'nx';
export type ChildLogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export type ChildNodeLaunchOptions = {
    entryFile: string;
    args?: string[];
    execArgv?: string[];
};

export type ChildNxLaunchOptions = {
    target: string;
    args?: string[];
    execArgv?: string[];
};

export type ChildAppDefinition = {
    name: string;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    node?: ChildNodeLaunchOptions;
    nx?: ChildNxLaunchOptions;
    autoStart?: boolean;
    restartOnCrash?: boolean;
    maxRestarts?: number;
    restartDelayMs?: number;
    healthCheckTimeoutMs?: number;
};

export type ParentBootstrapOptions = {
    mode?: BootstrapRuntimeMode;
    children: ChildAppDefinition[];
    shutdownSignals?: NodeJS.Signals[];
    healthCheckIntervalMs?: number;
    healthCheckTimeoutMs?: number;
    restartOnCrash?: boolean;
    maxRestarts?: number;
    restartDelayMs?: number;
    stopTimeoutMs?: number;
};

export type ParentToChildIpcMessage =
    | {
          type: 'lifecycle:hello';
          sentAt: number;
          parentPid: number;
      }
    | {
          type: 'health:ping';
          sentAt: number;
          requestId: string;
      }
    | {
          type: 'control:shutdown';
          sentAt: number;
          reason?: string;
      }
    | {
          type: 'control:restart';
          sentAt: number;
          reason?: string;
      };

export type ChildToParentIpcMessage =
    | {
          type: 'lifecycle:ready';
          sentAt: number;
          appName: string;
          pid: number;
      }
    | {
          type: 'lifecycle:stopping';
          sentAt: number;
          appName: string;
          pid: number;
          reason?: string;
      }
    | {
          type: 'lifecycle:restart-request';
          sentAt: number;
          appName: string;
          pid: number;
          reason?: string;
      }
    | {
          type: 'health:pong';
          sentAt: number;
          appName: string;
          pid: number;
          uptimeMs: number;
          requestId?: string;
      }
    | {
          type: 'lifecycle:log';
          sentAt: number;
          appName: string;
          pid: number;
          level: ChildLogLevel;
          message: string;
      };

export type BootstrapIpcMessage = ParentToChildIpcMessage | ChildToParentIpcMessage;

export type ChildAppLaunchResult = {
    child: ChildProcess;
    mode: BootstrapRuntimeMode;
    runner: ChildAppRunner;
    command: string;
    args: string[];
};

export type ParentChildStatus = {
    name: string;
    pid?: number;
    runner: ChildAppRunner;
    mode: BootstrapRuntimeMode;
    restarts: number;
    lastHeartbeatAt?: number;
    alive: boolean;
};

export type ChildProcessBridgeOptions = {
    appName?: string;
    onShutdown?: (reason?: string) => Promise<void> | void;
    onRestart?: (reason?: string) => Promise<void> | void;
    onParentMessage?: (message: ParentToChildIpcMessage) => Promise<void> | void;
};
