import type { EntityLike } from 'telegram/define';
import type { NewMessageEvent } from 'telegram/events';
import type { MtpClient } from '../mtp-client.class';
import { MtpMessage } from '../types/mtp-message.class';
import { MtpClientAction } from './mtp-client-action.class';

export class MtpClientActionBuilder {
    private _actions: Array<MtpClientAction> = [];
    private readonly _setupActions: Set<MtpClientAction> = new Set<MtpClientAction>();

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
            if (this._setupActions.has(action)) {
                continue;
            }

            const eventBuilder = action.getTgEvent(this._chat);
            if (!eventBuilder) {
                throw new Error('Action trigger is not set. Call onTrigger(...) before setupActions().');
            }

            const trigger = action.trigger;
            this._client.client.addEventHandler((event: NewMessageEvent) => {
                action.event$.next({ message: MtpMessage.fromEvent(event), trigger });
            }, eventBuilder);
            this._setupActions.add(action);
        }
    }
}
