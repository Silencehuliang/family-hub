/**
 * API 请求客户端(封装 fetch)
 * 自动带 Authorization header,统一错误处理
 */
import { ErrorCode } from '@family-hub/shared';

const TOKEN_KEY = 'fh_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

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
}

async function request<T>(path: string, opts: ReqOptions = {}): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

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
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};
