import { MtpClientAction } from './mtp-client-action.class';
import type { MtpClient } from '../mtp-client.class';
import type { EntityLike } from 'telegram/define';
import type { NewMessageEvent } from 'telegram/events';
import { MtpMessage } from '../types/mtp-message.class';

export class MtpClientActionBuilder {
    private _actions: Array<MtpClientAction> = [];

    constructor(
        private readonly _chat: EntityLike,
        private readonly _client: MtpClient,
    ) {}

    public newAction(): MtpClientAction {
        const action = new MtpClientAction();
        this._actions.push(action);
        return action;
    }

    public setupActions(): void {
        for (const action of this._actions) {
            this._client.client.addEventHandler((event: NewMessageEvent) => {
                action.event$.next({
                    trigger: action.trigger,
                    message: MtpMessage.fromEvent(event),
                });
            }, action.getTgEvent(this._chat));
        }
    }
}
