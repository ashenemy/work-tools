import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { BROKER_MESSAGE_PATTERNS } from './broker.constants';
import { BrokerService } from './broker.service';
import type { BrokerEmitAck, BrokerEmitPayload, BrokerPingResponse, BrokerRequestPayload } from '../@types';

@Controller()
export class BrokerController {
    constructor(private readonly _brokerService: BrokerService) {}

    @MessagePattern(BROKER_MESSAGE_PATTERNS.emit)
    public async emit(@Payload() message: BrokerEmitPayload): Promise<BrokerEmitAck> {
        const subject = this._resolveSubject(message?.subject);

        await this._brokerService.emit(subject, message?.payload);

        return {
            queued: true,
            subject,
        };
    }

    @MessagePattern(BROKER_MESSAGE_PATTERNS.request)
    public async request(@Payload() message: BrokerRequestPayload): Promise<unknown> {
        const subject = this._resolveSubject(message?.subject);

        return await this._brokerService.request(subject, message?.payload, message?.timeoutMs);
    }

    @MessagePattern(BROKER_MESSAGE_PATTERNS.ping)
    public ping(): BrokerPingResponse {
        return {
            ok: true,
            service: 'broker-service',
            timestamp: new Date().toISOString(),
        };
    }

    private _resolveSubject(subject: unknown): string {
        if (typeof subject !== 'string' || subject.trim().length === 0) {
            throw new RpcException('Broker subject must be a non-empty string');
        }

        return subject.trim();
    }
}
