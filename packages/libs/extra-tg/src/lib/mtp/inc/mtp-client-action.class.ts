import type { Optional } from '@work-tools/ts';
import type { MTPClientActionEvent, MTPClientActionFilter, MTPClientActionTrigger } from '../../../@types';
import { type Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { isDefined, isUndefined } from '@work-tools/utils';
import { NewMessage } from 'telegram/events';
import { EventBuilder } from 'telegram/events/common';
import type { EntityLike } from 'telegram/define';

export class MtpClientAction {
    private _filter: Optional<MTPClientActionFilter> = undefined;

    constructor() {
    }

    private _trigger: Optional<MTPClientActionTrigger> = undefined;

    public get trigger(): MTPClientActionTrigger {
        if (isUndefined(this._trigger)) {
            throw new Error('Trigger is not set');
        }

        return this._trigger;
    }

    private _event$: Subject<MTPClientActionEvent> = new Subject<MTPClientActionEvent>();

    public get event$(): Subject<MTPClientActionEvent> {
        return this._event$;
    }

    public onTrigger(trigger: MTPClientActionTrigger): this {
        this._trigger = trigger;
        return this;
    }

    public filter(filter: MTPClientActionFilter): this {
        this._filter = filter;
        return this;
    }

    public build(): Observable<MTPClientActionEvent> {
        if(isUndefined(this._trigger)) {
            throw new Error('Trigger is not set');
        }

        return this._event$.asObservable().pipe(
            filter((event) => {
                if (isDefined(this._filter)) {
                    if (this._filter === 'have-document') {
                        return isDefined(event.message.document);
                    } else if (this._filter === 'have-bot-start-link') {
                        return event.message.keyboardUrlButtons.length > 0;
                    }

                    return false;
                }

                return true;
            }),
        );
    }

    public getTgEvent(chat: EntityLike): Optional<EventBuilder> {
        if (isDefined(this._trigger)) {
            return new NewMessage({
                chats: [chat],
                incoming: true,
            });
        }

        return undefined;
    }
}
