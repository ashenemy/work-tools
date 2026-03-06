import { escapeHtml } from '@work-tools/utils';
import { normalizeDomains, obfuscateDomainDots } from '../format/domain';
import type { BotApiKVValue, BotApiMessagePayload } from '../../../../@types';
import { hr } from '../format/hr';

export class BotApiTextBuilder {
    private readonly _out: string[] = [];
    private _indentLevel = 0;
    private readonly _indentSize: number;

    constructor(indentSize = 4) {
        this._indentSize = Math.max(0, Math.floor(indentSize));
    }

    public setIndent(level: number): this {
        this._indentLevel = Math.max(0, Math.floor(level));
        return this;
    }

    public indent(levels = 1): this {
        this._indentLevel = Math.max(0, this._indentLevel + Math.floor(levels));
        return this;
    }

    public outdent(levels = 1): this {
        this._indentLevel = Math.max(0, this._indentLevel - Math.floor(levels));
        return this;
    }

    public section(title: string, fn: (b: BotApiTextBuilder) => void): this {
        this._out.push(escapeHtml(title));
        const prev = this._indentLevel;
        this._indentLevel = prev + 1;
        fn(this);
        this._indentLevel = prev;
        return this;
    }

    public title(icon: string, text: string): this {
        return this.raw(`${escapeHtml(icon)} <b>${escapeHtml(text)}</b>`);
    }

    public line(text: string): this {
        return this.raw(escapeHtml(text));
    }

    public raw(htmlLine: string): this {
        const prefix = ' '.repeat(this._indentLevel * this._indentSize);
        this._out.push(prefix + htmlLine);
        return this;
    }

    public empty(): this {
        this._out.push('');
        return this;
    }

    public hr(length?: number): this {
        return this.raw(hr(length));
    }

    public kv(icon: string, key: string, value: BotApiKVValue): this {
        const v = typeof value === 'number' ? String(value) : value;
        return this.raw(`${escapeHtml(icon)} <b>${escapeHtml(key)}:</b> <code>${escapeHtml(v)}</code>`);
    }

    public list(items: string[], bullet = '•'): this {
        for (const item of items) this.raw(`${escapeHtml(bullet)} ${escapeHtml(item)}`);
        return this;
    }

    public checks(items: string[], checkIcon = '✅'): this {
        for (const item of items) this.raw(`${escapeHtml(checkIcon)} ${escapeHtml(item)}`);
        return this;
    }

    public codeInline(value: string): this {
        return this.raw(`<code>${escapeHtml(value)}</code>`);
    }

    public codeBlock(value: string): this {
        return this.raw(`<pre><code>${escapeHtml(value)}</code></pre>`);
    }

    public domainsList(domains: readonly string[]): this {
        const normalized = normalizeDomains(domains).map(obfuscateDomainDots);
        const value = normalized.length ? normalized.join(', ') : '—';
        return this.raw(`<code>${escapeHtml(value)}</code>`);
    }

    public build(): BotApiMessagePayload {
        return { text: this._out.join('\n'), parse_mode: 'HTML' };
    }
}
