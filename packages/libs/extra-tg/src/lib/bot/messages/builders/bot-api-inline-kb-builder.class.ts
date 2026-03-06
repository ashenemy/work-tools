import type { BotApiInlineKeyboardButton, BotApiInlineKeyboardMarkup } from '../../../../@types';

export class BotApiInlineKbBuilder {
    private _rows: BotApiInlineKeyboardButton[][] = [[]];

    public text(label: string, callbackData: string): this {
        this._currentRow().push({ text: label, callback_data: callbackData });
        return this;
    }

    public url(label: string, url: string): this {
        this._currentRow().push({ text: label, url });
        return this;
    }

    public webApp(label: string, url: string): this {
        this._currentRow().push({ text: label, web_app: { url } });
        return this;
    }

    public disabled(label: string, data = 'mk:disabled'): this {
        this._currentRow().push({ text: label, callback_data: data });
        return this;
    }

    public delimiter(label = '────────────', data = 'mk:disabled'): this {
        return this.disabled(label, data);
    }

    public row(): this {
        if (this._currentRow().length > 0) {
            this._rows.push([]);
        }

        return this;
    }

    public build(): BotApiInlineKeyboardMarkup {
        const normalized = this._rows.filter((r) => r.length > 0);
        return { inline_keyboard: normalized.length ? normalized : [[]] };
    }

    private _currentRow(): BotApiInlineKeyboardButton[] {
        return this._rows[this._rows.length - 1];
    }
}
