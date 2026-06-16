/**
 * D1 snake_case → TypeScript camelCase 通用映射
 */

/** 单个字段 snake_case → camelCase */
function toCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** 映射一行记录 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function camelCase<T>(row: any): T {
  if (!row) return row;
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    result[toCamel(k)] = v;
  }
  return result as T;
}

/** 映射多行记录 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function camelCaseAll<T>(rows: any[]): T[] {
  return rows.map((r) => camelCase<T>(r));
}
