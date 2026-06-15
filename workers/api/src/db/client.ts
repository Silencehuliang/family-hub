/**
 * D1 查询辅助
 */
import type { Env } from '../env';

/** 获取当前 Unix 时间戳(秒) */
export function now(): number {
  return Math.floor(Date.now() / 1000);
}

/** 从环境拿 DB */
export function getDb(env: Env): D1Database {
  return env.DB;
}

/** 通用单行查询 */
export async function findOne<T>(db: D1Database, sql: string, ...params: unknown[]): Promise<T | null> {
  const stmt = db.prepare(sql).bind(...params);
  const result = await stmt.first<T>();
  return result ?? null;
}

/** 通用多行查询 */
export async function findMany<T>(db: D1Database, sql: string, ...params: unknown[]): Promise<T[]> {
  const stmt = db.prepare(sql).bind(...params);
  const result = await stmt.all<T>();
  return result.results ?? [];
}

/** 通用写入(INSERT/UPDATE/DELETE) */
export async function execute(db: D1Database, sql: string, ...params: unknown[]): Promise<D1Result> {
  return db.prepare(sql).bind(...params).run();
}

/** 批量写入(事务) */
export async function batchExecute(db: D1Database, statements: Array<{ sql: string; params: unknown[] }>): Promise<D1Result[]> {
  const stmts = statements.map((s) => db.prepare(s.sql).bind(...s.params));
  return db.batch(stmts);
}
