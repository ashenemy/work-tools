import type { LevelStyle, LogLevel } from '../../@types';

export class LoggerDesign {
    public static readonly COLORS = {
        reset: '\x1b[0m',
        dim: '\x1b[2m',
        gray: '\x1b[90m',
        cyan: '\x1b[36m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        red: '\x1b[31m',
        magenta: '\x1b[35m',
        blue: '\x1b[34m',
    };

    public static readonly LEVEL_STYLES: Record<LogLevel, LevelStyle> = {
        log: { tag: 'LOG', icon: '>', color: LoggerDesign.COLORS.green },
        info: { tag: 'INF', icon: 'i', color: LoggerDesign.COLORS.cyan },
        warn: { tag: 'WRN', icon: '!', color: LoggerDesign.COLORS.yellow, stderr: true },
        error: { tag: 'ERR', icon: 'x', color: LoggerDesign.COLORS.red, stderr: true },
        debug: { tag: 'DBG', icon: '#', color: LoggerDesign.COLORS.magenta },
        verbose: { tag: 'VRB', icon: '~', color: LoggerDesign.COLORS.blue },
    };
}
