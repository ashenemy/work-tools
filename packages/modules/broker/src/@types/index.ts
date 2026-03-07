export type BrokerNatsOptions = {
    servers?: string[];
    queue?: string;
    name?: string;
};

export type BrokerResolvedNatsOptions = {
    servers: string[];
    queue?: string;
    name?: string;
};

export type BrokerModuleOptions = {
    nats?: BrokerNatsOptions;
    defaultRequestTimeoutMs?: number;
};

export type BrokerEmitPayload<TPayload = unknown> = {
    subject: string;
    payload: TPayload;
};

export type BrokerRequestPayload<TPayload = unknown> = {
    subject: string;
    payload: TPayload;
    timeoutMs?: number;
};

export type BrokerEmitAck = {
    queued: true;
    subject: string;
};

export type BrokerPingResponse = {
    ok: true;
    service: 'broker-service';
    timestamp: string;
};
