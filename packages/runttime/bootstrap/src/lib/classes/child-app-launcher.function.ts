import { fork } from 'node:child_process';
import { isAbsolute, resolve } from 'node:path';
import type { BootstrapRuntimeMode, ChildAppDefinition, ChildAppLaunchResult } from '../../@types';

export function resolveBootstrapMode(mode?: BootstrapRuntimeMode): BootstrapRuntimeMode {
    if (mode) {
        return mode;
    }

    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}

export function launchChildAppProcess(app: ChildAppDefinition, mode?: BootstrapRuntimeMode): ChildAppLaunchResult {
    const resolvedMode = resolveBootstrapMode(mode);
    const cwd = app.cwd ?? process.cwd();
    const env: NodeJS.ProcessEnv = { ...process.env, ...app.env };

    if (resolvedMode === 'production') {
        const entryFile = app.node?.entryFile;

        if (!entryFile) {
            throw new Error(`Child app "${app.name}" is missing node.entryFile for production mode.`);
        }

        const absEntryFile = isAbsolute(entryFile) ? entryFile : resolve(cwd, entryFile);
        const args = [...(app.node?.args ?? [])];

        const child = fork(absEntryFile, args, {
            cwd,
            env,
            execArgv: app.node?.execArgv ?? [],
            stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        });

        return {
            child,
            mode: resolvedMode,
            runner: 'node',
            command: process.execPath,
            args: [absEntryFile, ...args],
        };
    }

    const nxTarget = app.nx?.target;

    if (!nxTarget) {
        throw new Error(`Child app "${app.name}" is missing nx.target for development mode.`);
    }

    const nxCliPath = require.resolve('nx/bin/nx.js');
    const args = ['run', nxTarget, ...(app.nx?.args ?? [])];

    const child = fork(nxCliPath, args, {
        cwd,
        env,
        execArgv: app.nx?.execArgv ?? [],
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    });

    return {
        child,
        mode: resolvedMode,
        runner: 'nx',
        command: process.execPath,
        args: [nxCliPath, ...args],
    };
}
