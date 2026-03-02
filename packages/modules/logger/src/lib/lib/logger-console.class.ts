import type { ConsoleMethods, LogLevel } from '../../@types';
import { LoggerService } from '../logger.service';

export class LoggerConsole {
    public static _consolePatched = false;

    public static $(logger: LoggerService): LoggerConsole {
        const self = new LoggerConsole(logger);

        self.captureConsole();

        return self;
    }

    private static readonly _originalConsole: ConsoleMethods = {
        log: console.log.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
        debug: console.debug.bind(console),
    };

    constructor(private readonly _logger: LoggerService) {}

    public captureConsole(): void {
        if (LoggerConsole._consolePatched) {
            return;
        }

        LoggerConsole._consolePatched = true;

        console.log = (...args: unknown[]) => {
            this._capture('log', args);
        };
        console.info = (...args: unknown[]) => {
            this._capture('info', args);
        };
        console.warn = (...args: unknown[]) => {
            this._capture('warn', args);
        };
        console.error = (...args: unknown[]) => {
            this._capture('error', args);
        };
        console.debug = (...args: unknown[]) => {
            this._capture('debug', args);
        };
    }

    public restoreConsole(): void {
        if (!LoggerConsole._consolePatched) {
            return;
        }

        LoggerConsole._consolePatched = false;
        console.log = LoggerConsole._originalConsole.log;
        console.info = LoggerConsole._originalConsole.info;
        console.warn = LoggerConsole._originalConsole.warn;
        console.error = LoggerConsole._originalConsole.error;
        console.debug = LoggerConsole._originalConsole.debug;
    }

    private _capture(level: LogLevel, args: unknown[]): void {
        const [message, ...rest] = args;
        this._logger[level](message ?? '', rest);
    }
}