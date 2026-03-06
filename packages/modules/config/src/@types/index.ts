export type ConfigPath<T> = T extends readonly unknown[]
    ? never
    : T extends Record<string, unknown>
      ? {
            [K in Extract<keyof T, string>]: NonNullable<T[K]> extends readonly unknown[] ? K : NonNullable<T[K]> extends Record<string, unknown> ? K | `${K}.${ConfigPath<NonNullable<T[K]>>}` : K;
        }[Extract<keyof T, string>]
      : never;

export type ConfigPathValue<T, P extends string> = P extends `${infer Head}.${infer Tail}` ? (Head extends Extract<keyof T, string> ? ConfigPathValue<NonNullable<T[Head]>, Tail> : never) : P extends Extract<keyof T, string> ? T[P] : never;
