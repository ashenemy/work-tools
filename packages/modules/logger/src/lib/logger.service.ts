import { Global, Inject, Injectable, LoggerService as _LoggerService, Optional as Optional_ } from '@nestjs/common';
import { inspect } from 'node:util';
import { APP_NAME } from './logger.constants';
import type { LevelStyle, LogLevel } from '../@types';
import { LoggerDesign } from './lib/logger-design.class';
import { enableSourceMapSupport } from './lib/source-map';
import { LoggerConsole } from './lib/logger-console.class';
import type { Optional } from '@work-tools/ts';

@Global()
@Injectable()
export class LoggerService implements _LoggerService {
    constructor(
        @Optional_()
        @Inject(APP_NAME) private readonly _appName: Optional<string> = undefined,
    ) {
        this.installRuntimeSupport();
    }

    public installRuntimeSupport(): void {
        enableSourceMapSupport();

        LoggerConsole.$(this);
    }

    public log(message: unknown, ...optionalParams: unknown[]): void {
        this._write('log', message, optionalParams);
    }

    public info(message: unknown, ...optionalParams: unknown[]): void {
        this._write('info', message, optionalParams);
    }

    public warn(message: unknown, ...optionalParams: unknown[]): void {
        this._write('warn', message, optionalParams);
    }

    public error(message: unknown, ...optionalParams: unknown[]): void {
        this._write('error', message, optionalParams);
    }

    public debug(message: unknown, ...optionalParams: unknown[]): void {
        this._write('debug', message, optionalParams);
    }

    public verbose(message: unknown, ...optionalParams: unknown[]): void {
        this._write('verbose', message, optionalParams);
    }

    public fatal(message: unknown, ...optionalParams: unknown[]): void {
        this._write('error', message, optionalParams);
    }

    private _write(level: LogLevel, message: unknown, rest: unknown[]): void {
        const style = LoggerDesign.LEVEL_STYLES[level];
        const body = [message, ...rest].map((value) => this._format(value)).join(' ');
        const line = `${this._formatPrefix(style)} ${body}`;

        if (style.stderr) {
            process.stderr.write(`${line}\n`);
            return;
        }

        process.stdout.write(`${line}\n`);
    }

    private _formatPrefix(style: LevelStyle): string {
        const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
        const name = this.appName ?? 'app';

        return [`${LoggerDesign.COLORS.dim}${ts}${LoggerDesign.COLORS.reset}`, `${style.color}${style.icon} ${style.tag}${LoggerDesign.COLORS.reset}`, `${LoggerDesign.COLORS.gray}[${name}]${LoggerDesign.COLORS.reset}`].join(' ');
    }

    private _format(value: unknown): string {
        if (value instanceof Error) {
            return value.stack ?? `${value.name}: ${value.message}`;
        }

        if (typeof value === 'string') {
            return value;
        }

        return inspect(value, {
            colors: true,
            depth: 6,
            compact: false,
            breakLength: 120,
        });
    }

    private get appName(): string {
        return this._appName ?? 'app';
    }
}
