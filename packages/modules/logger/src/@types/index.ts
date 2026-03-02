export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'verbose';

export type ConsoleMethods = Pick<Console, 'log' | 'info' | 'warn' | 'error' | 'debug'>;

export type LevelStyle = {
    tag: string;
    icon: string;
    color: string;
    stderr?: boolean;
};
