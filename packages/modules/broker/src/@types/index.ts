export type BrokerNatsOptions = { queue?: string; name?: string };

export type BrokerResolvedNatsOptions = { server: string; queue?: string; name?: string };

export type BrokerModuleOptions = { nats?: BrokerNatsOptions; defaultRequestTimeoutMs?: number };
