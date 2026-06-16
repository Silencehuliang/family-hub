/**
 * Pages Functions 入口（API 路由）
 * 被 apps/web/functions/*.ts 导入，同域处理 API 请求
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, HonoVars } from './env';
import { logMiddleware } from './middleware/log';
import { authMiddleware } from './middleware/auth';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { deviceRoutes } from './routes/device';
import { billRoutes } from './routes/bill';
import { workspaceRoutes } from './routes/workspace';
import { todoRoutes } from './routes/todo';
import { shopRoutes } from './routes/shop';
import { eventRoutes } from './routes/event';

const app = new Hono<{ Bindings: Env; Variables: HonoVars }>();

// ── 全局错误兜底(必须最先注册,捕获所有路由抛出的错误) ──────────
app.onError((err, c) => {
  console.error('[onError]', err);
  // 统一返回 JSON 错误,避免前端收到非 JSON 响应
  if (err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string') {
    // BizError
    const be = err as { code: string; message: string; status?: number; field?: string };
    return c.json(
      { error: { code: be.code, message: be.message, ...(be.field ? { field: be.field } : {}) } },
      (be.status ?? 500) as 400 | 401 | 403 | 404 | 409 | 422 | 423 | 500 | 502,
    );
  }
  // ZodError
  if (err && typeof err === 'object' && 'issues' in err && Array.isArray((err as { issues: unknown[] }).issues)) {
    const zErr = err as { issues: Array<{ path: PropertyKey[]; message: string }> };
    const first = zErr.issues[0];
    return c.json(
      { error: { code: 'VALIDATION', message: first?.message ?? '参数校验失败' } },
      422 as 422,
    );
  }
  // 其他错误
  const msg = err instanceof Error ? err.message : '服务器内部错误';
  return c.json({ error: { code: 'INTERNAL', message: msg } }, 500 as 500);
});

// ── 全局中间件 ─────────────────────────────────────────────────
app.use('*', logMiddleware);
app.use('*', cors({
  origin: (origin) => origin ?? '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── 公开路由 ───────────────────────────────────────────────────
app.route('/health', healthRoutes);
app.route('/auth', authRoutes);

// ── 需认证的 API 路由 ─────────────────────────────────────────
// device 路由内部自行管理认证
app.use('/api/*', authMiddleware);
app.route('/api/device', deviceRoutes);
app.route('/api/bill', billRoutes);
app.route('/api/todo', todoRoutes);
app.route('/api/shop', shopRoutes);
app.route('/api/event', eventRoutes);
app.route('/api/workspace', workspaceRoutes);

// ── 404 ────────────────────────────────────────────────────────
app.notFound((c) =>
  c.json({ error: { code: 'NOT_FOUND', message: '接口不存在' } }, 404),
);

export default {
  fetch: app.fetch,
};
