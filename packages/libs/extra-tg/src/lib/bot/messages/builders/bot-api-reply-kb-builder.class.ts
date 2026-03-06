import type { BotApiForceReply, BotApiKeyboardButton, BotApiReplyKeyboardMarkup, BotApiReplyKeyboardRemove } from '../../../../@types';

export class BotApiReplyKbBuilder {
    private _rows: BotApiKeyboardButton[][] = [[]];
    private _opts: Omit<BotApiReplyKeyboardMarkup, 'keyboard'> = {};

    public text(label: string): this {
        this._currentRow().push({ text: label });
        return this;
    }

    public webApp(label: string, url: string): this {
        this._currentRow().push({ text: label, web_app: { url } });
        return this;
    }

    public row(): this {
        if (this._currentRow().length > 0) this._rows.push([]);
        return this;
    }

    public resized(value = true): this {
        this._opts.resize_keyboard = value;
        return this;
    }

    public oneTime(value = true): this {
        this._opts.one_time_keyboard = value;
        return this;
    }

    public selective(value = true): this {
        this._opts.selective = value;
        return this;
    }

    public placeholder(text: string): this {
        this._opts.input_field_placeholder = text;
        return this;
    }

    public persistent(value = true): this {
        this._opts.is_persistent = value;
        return this;
    }

    public build(): BotApiReplyKeyboardMarkup {
        const normalized = this._rows.filter((r) => r.length > 0);

        if (normalized.length === 0) {
            throw new Error('Reply keyboard must contain at least one button');
        }

        return { keyboard: normalized, ...this._opts };
    }

    private _currentRow(): BotApiKeyboardButton[] {
        return this._rows[this._rows.length - 1];
    }
}

export function removeKeyboard(selective = false): BotApiReplyKeyboardRemove {
    return selective ? { remove_keyboard: true, selective: true } : { remove_keyboard: true };
}

export function forceReply(placeholder?: string, selective = true): BotApiForceReply {
    const fr: BotApiForceReply = { force_reply: true, selective };
    if (placeholder) fr.input_field_placeholder = placeholder;
    return fr;
}
