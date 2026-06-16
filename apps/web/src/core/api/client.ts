/**
 * API 请求客户端(封装 fetch)
 * 统一错误处理，cookie 鉴权
 */
import { ErrorCode } from '@family-hub/shared';

export class ApiError extends Error {
  code: string;
  field?: string;
  status: number;
  constructor(code: string, message: string, status: number, field?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.field = field;
  }
}

interface ReqOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  plainText?: boolean;
}

async function request<T>(path: string, opts: ReqOptions = {}): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {};
  if (!opts.plainText) {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  const res = await fetch(url.toString(), {
    method: opts.method ?? 'GET',
    headers,
    credentials: 'include',
    body: opts.body ? (opts.plainText ? (opts.body as string) : JSON.stringify(opts.body)) : undefined,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  const json = await res.json();

  if (!res.ok) {
    const err = json?.error;
    throw new ApiError(
      err?.code ?? ErrorCode.INTERNAL,
      err?.message ?? '请求失败',
      res.status,
      err?.field,
    );
  }

  return (json as { data: T }).data;
}

export const api = {
  get: <T>(path: string, opts?: Omit<ReqOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: Omit<ReqOptions, 'method'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }),
};
