/**
 * 请求日志中间件
 */
import type { MiddlewareHandler } from 'hono';

export const logMiddleware: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;
  // 仅在开发环境输出详细日志;生产走 Cloudflare Logpush
  console.log(`[${method}] ${path} → ${status} (${duration}ms)`);
};
