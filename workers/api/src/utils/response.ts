/**
 * 统一响应与业务错误
 */
import type { Context } from 'hono';
import { ErrorCode, errorStatus } from '@family-hub/shared';
import type { Env, HonoVars } from '../env';

// Hono 的 c.json() 要求 status 为字面量类型,用断言绕过
type StatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 409 | 422 | 423 | 500 | 502;

/** 业务错误,携带错误码与可选字段名 */
export class BizError extends Error {
  code: ErrorCode;
  field?: string;
  status: number;

  constructor(code: ErrorCode, message: string, field?: string) {
    super(message);
    this.name = 'BizError';
    this.code = code;
    this.field = field;
    this.status = errorStatus[code];
  }
}

type AppContext = Context<{ Bindings: Env; Variables: HonoVars }>;

/** 成功响应 */
export function ok<T>(c: AppContext, data: T, status = 200) {
  return c.json({ data }, status as StatusCode);
}

/** 从未知错误生成统一错误响应 */
export function errorResponse(c: AppContext, err: unknown) {
  if (err instanceof BizError) {
    return c.json(
      { error: { code: err.code, message: err.message, ...(err.field ? { field: err.field } : {}) } },
      err.status as StatusCode,
    );
  }

  // ZodError:参数校验失败
  if (err && typeof err === 'object' && 'issues' in err && Array.isArray((err as { issues: unknown[] }).issues)) {
    const zErr = err as { issues: Array<{ path: PropertyKey[]; message: string }> };
    const first = zErr.issues[0];
    const field = first?.path?.join('.') || undefined;
    return c.json(
      { error: { code: ErrorCode.VALIDATION, message: first?.message ?? '参数校验失败', ...(field ? { field } : {}) } },
      422 as StatusCode,
    );
  }

  console.error('[unhandled]', err);
  const msg = err instanceof Error ? err.message : '服务器内部错误';
  return c.json({ error: { code: ErrorCode.INTERNAL, message: msg } }, 500 as StatusCode);
}
