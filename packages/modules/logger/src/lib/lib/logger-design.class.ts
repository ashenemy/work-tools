import type { LevelStyle, LogLevel } from '../../@types';

export class LoggerDesign {
    public static readonly COLORS = {
        blue: '\x1b[34m',
        cyan: '\x1b[36m',
        dim: '\x1b[2m',
        gray: '\x1b[90m',
        green: '\x1b[32m',
        magenta: '\x1b[35m',
        red: '\x1b[31m',
        reset: '\x1b[0m',
        yellow: '\x1b[33m',
    };

    public static readonly LEVEL_STYLES: Record<LogLevel, LevelStyle> = {
        debug: { color: LoggerDesign.COLORS.magenta, icon: '#', tag: 'DBG' },
        error: { color: LoggerDesign.COLORS.red, icon: 'x', stderr: true, tag: 'ERR' },
        info: { color: LoggerDesign.COLORS.cyan, icon: 'i', tag: 'INF' },
        log: { color: LoggerDesign.COLORS.green, icon: '>', tag: 'LOG' },
        verbose: { color: LoggerDesign.COLORS.blue, icon: '~', tag: 'VRB' },
        warn: { color: LoggerDesign.COLORS.yellow, icon: '!', stderr: true, tag: 'WRN' },
    };
}
