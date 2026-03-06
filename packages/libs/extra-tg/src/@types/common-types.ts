export type UrlBotData = {
    botName: string;
    startArg: string;
};

export type TruncateResult = { value: string; truncated: boolean };

export type NormalizeDomainResult = { ok: true; value: string } | { ok: false; reason: 'empty' | 'invalid_host' | 'ip_or_localhost' };
