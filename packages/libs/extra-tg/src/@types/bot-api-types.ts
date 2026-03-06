import type { Context } from 'grammy';

export type BotApiClientConfig = {
    botToken: string;
    botName: string;
};

export type BotApiParseMode = 'HTML' | 'MarkdownV2';

export type BotApiInlineKeyboardButton = {
    text: string;
} & ({ callback_data: string } | { url: string } | { web_app: { url: string } });

export type BotApiInlineKeyboardMarkup = {
    inline_keyboard: BotApiInlineKeyboardButton[][];
};

export type BotApiKeyboardButton = {
    text: string;
    web_app?: { url: string };
};

export type BotApiReplyKeyboardMarkup = {
    keyboard: BotApiKeyboardButton[][];
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
    selective?: boolean;
    input_field_placeholder?: string;
    is_persistent?: boolean;
};

export type BotApiReplyKeyboardRemove = {
    remove_keyboard: true;
    selective?: boolean;
};

export type BotApiForceReply = {
    force_reply: true;
    selective?: boolean;
    input_field_placeholder?: string;
};

export type BotApiReplyMarkup = BotApiInlineKeyboardMarkup | BotApiReplyKeyboardMarkup | BotApiReplyKeyboardRemove | BotApiForceReply;

export type BotApiMessagePayload = {
    text: string;
    parse_mode?: BotApiParseMode;
    reply_markup?: BotApiReplyMarkup;
};

export type BotApiKVValue = string | number;

export type BotApiFileResolver = (fileName: string) => Promise<{ path: string; name?: string } | null>;

export type BotApiNewLogFlowPayload = {
    flagIcon: string;
    checkboxItems: string[];
    domains: string[];
    dateText: string;
    allCount: number;
    isMac: boolean;
    fileName: string;
};

export type BotApiTopicTarget = {
    chatId: number | string;
    threadId?: number;
};

export type BotApiEvent = {
    name: string;
    ctx: Context;
};
