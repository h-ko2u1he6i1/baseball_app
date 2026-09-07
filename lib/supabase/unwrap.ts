// Supabase の embedded resource は to-one でも型上は配列になることがある。
// 実体（オブジェクト / 配列 / null）をならして 1 件を取り出す。
export function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
