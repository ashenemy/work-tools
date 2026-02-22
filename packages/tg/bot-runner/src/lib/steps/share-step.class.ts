import { TelegramClient } from 'telegram';
import { BaseLogMessage } from '@work-tools/log-message';
import { Optional } from '@work-tools/ts';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { BOXED_BOT_GROUP_ID } from '../configs.constants';
import type { EventBuilder } from 'telegram/events/common';

export class ShareRunnerStep {
    public static async run(client: TelegramClient, logMessage: BaseLogMessage): Promise<Optional<BaseLogMessage>> {
        const _: ShareRunnerStep = new ShareRunnerStep(client);
        return await _._run(logMessage);
    }

    private constructor(private readonly _client: TelegramClient) {}

    private async _run(logMessage: BaseLogMessage): Promise<Optional<BaseLogMessage>> {
        return new Promise(async (resolve, reject) => {

            if (logMessage.isLogMessage) {
                const event = new NewMessage({ chats: [BOXED_BOT_GROUP_ID], incoming: true });

                const cb = async (event: NewMessageEvent) => {
                    const logMessage: BaseLogMessage = new BaseLogMessage(event.message, this._client);
                    if (logMessage.haveFile) {
                        this._client.removeEventHandler(cb, event as unknown as EventBuilder);
                        resolve(logMessage);
                    }
                };

                this._client.addEventHandler(cb, event);

                await logMessage.share();
            }

            return resolve(undefined);
        });
    }
}
