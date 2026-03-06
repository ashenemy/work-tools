export function isTwoDArrayType<T>(value: unknown): value is T[][] {
  return Array.isArray(value) && value.every(Array.isArray);
}