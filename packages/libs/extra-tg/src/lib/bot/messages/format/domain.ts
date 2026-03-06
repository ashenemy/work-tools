import type { NormalizeDomainResult } from '../../../../@types';

const COMMON_PUBLIC_SUFFIXES = new Set<string>(['co.uk', 'org.uk', 'gov.uk', 'ac.uk', 'net.uk', 'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'com.br', 'net.br', 'org.br', 'gov.br', 'co.jp', 'ne.jp', 'or.jp', 'go.jp', 'ac.jp', 'co.kr', 'ne.kr', 'or.kr', 'go.kr', 'ac.kr', 'co.in', 'net.in', 'org.in', 'gov.in', 'ac.in', 'co.nz', 'net.nz', 'org.nz', 'govt.nz', 'ac.nz', 'co.za', 'org.za', 'gov.za', 'ac.za', 'com.tr', 'net.tr', 'org.tr', 'gov.tr', 'edu.tr', 'com.mx', 'org.mx', 'gob.mx', 'edu.mx', 'com.cn', 'net.cn', 'org.cn', 'gov.cn', 'edu.cn', 'com.ru', 'net.ru', 'org.ru', 'com.ua', 'net.ua', 'org.ua', 'com.kz', 'org.kz', 'edu.kz']);

function isIPv4(host: string): boolean {
    const parts = host.split('.');
    if (parts.length !== 4) return false;
    for (const p of parts) {
        if (!/^\d+$/.test(p)) return false;
        const n = Number(p);
        if (n < 0 || n > 255) return false;
    }
    return true;
}

function isIPv6(host: string): boolean {
    return host.includes(':');
}

export function normalizeToRegistrableDomain(input: string): NormalizeDomainResult {
    const raw = String(input ?? '').trim();
    if (!raw) return { ok: false, reason: 'empty' };

    let host = '';
    try {
        const u = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`);
        host = u.hostname;
    } catch {
        const stripped = raw.replace(/^mailto:/i, '').split(/[\/?#\s]/, 1)[0];
        host = stripped.includes('@') ? (stripped.split('@').pop() ?? '') : stripped;
        host = host.replace(/:\d+$/, '');
    }

    host = host.trim().toLowerCase();

    if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);
    host = host.replace(/^\.+|\.+$/g, '');
    host = host.replace(/^www\d*\./, '');

    if (!host) return { ok: false, reason: 'invalid_host' };
    if (host === 'localhost' || isIPv4(host) || isIPv6(host)) return { ok: false, reason: 'ip_or_localhost' };

    const parts = host.split('.').filter(Boolean);
    if (parts.length < 2) return { ok: false, reason: 'invalid_host' };

    const last2 = parts.slice(-2).join('.');
    const last3 = parts.slice(-3).join('.');

    if (COMMON_PUBLIC_SUFFIXES.has(last2)) {
        if (parts.length >= 3) return { ok: true, value: parts.slice(-3).join('.') };
        return { ok: false, reason: 'invalid_host' };
    }

    if (COMMON_PUBLIC_SUFFIXES.has(last3)) {
        if (parts.length >= 4) return { ok: true, value: parts.slice(-4).join('.') };
        return { ok: false, reason: 'invalid_host' };
    }

    return { ok: true, value: last2 };
}

export function obfuscateDomainDots(domain: string): string {
    return String(domain ?? '').replaceAll('.', '(.)');
}

export function normalizeDomains(inputs: readonly string[]): string[] {
    const set = new Set<string>();
    for (const x of inputs) {
        const r = normalizeToRegistrableDomain(String(x ?? ''));
        if (r.ok) set.add(r.value);
    }
    return Array.from(set).sort();
}
