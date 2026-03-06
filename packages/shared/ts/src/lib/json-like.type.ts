export type JsonPrimitive = string | number | boolean | null;
// @ts-ignore
export type JsonObject = Record<string, JsonLike>;
export type JsonArray = JsonLike[];

// @ts-ignore
export type JsonLike = JsonPrimitive | JsonObject | JsonArray;
