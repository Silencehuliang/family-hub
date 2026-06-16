/**
 * Cloudflare Workers 入口
 * Hono 应用 + 认证路由 + Cron 定时任务占位
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
  origin: '*', // 生产环境应限制为 APP_BASE_URL
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ── 公开路由 ───────────────────────────────────────────────────
app.route('/health', healthRoutes);
app.route('/auth', authRoutes);

// ── 需认证的 API 路由 ─────────────────────────────────────────
// device 路由内部自行管理认证
app.use('/api/*', authMiddleware);
app.route('/api/device', deviceRoutes);
app.route('/api/bill', billRoutes);

// ── 工作台摘要 ────────────────────────────────────────────────
app.get('/api/workspace/summary', async (c) => {
  const { familyId } = c.var.auth;
  const month = new Date().toISOString().slice(0, 7);

  // 本月支出
  const spending = await c.env.DB.prepare(
    'SELECT COALESCE(SUM(amount), 0) as total FROM bill_record WHERE family_id = ? AND bill_date LIKE ? AND deleted_at IS NULL'
  ).bind(familyId, `${month}%`).first<{ total: number }>();

  // 总预算
  const budget = await c.env.DB.prepare(
    'SELECT amount FROM bill_budget WHERE family_id = ? AND month = ? AND category_l1 IS NULL'
  ).bind(familyId, month).first<{ amount: number }>();

  // 待买清单数
  const shopCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM shop_item si JOIN shop_list sl ON sl.id = si.list_id WHERE sl.family_id = ? AND si.bought = 0'
  ).bind(familyId).first<{ cnt: number }>();

  // 近期日程(未来 7 天)
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 7);
  const events = await c.env.DB.prepare(
    'SELECT id, title, start_at, type FROM event_item WHERE family_id = ? AND start_at >= ? AND start_at <= ? ORDER BY start_at LIMIT 5'
  ).bind(familyId, Math.floor(Date.now() / 1000), Math.floor(weekLater.getTime() / 1000)).all();

  return c.json({
    data: {
      monthSpending: spending?.total ?? 0,
      monthBudget: budget?.amount,
      todayReminders: [],
      pendingShopCount: shopCount?.cnt ?? 0,
      upcomingEvents: events.results ?? [],
    },
  });
});

// ── 404 ────────────────────────────────────────────────────────
app.notFound((c) =>
  c.json({ error: { code: 'NOT_FOUND', message: '接口不存在' } }, 404),
);

// ── Cron 定时任务(Phase 5 启用) ───────────────────────────────
export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    console.log('[cron] scheduled event triggered:', event.cron);

    // Phase 5: 通知调度
    // ctx.waitUntil(Promise.all([
    //   notifyDispatcher.checkEvents(),
    //   notifyDispatcher.checkTodos(),
    //   billBudgetService.checkOverBudget(),
    // ]));

    // Phase 2: 周期账单自动生成
    try {
      const { RecurringService } = await import('./modules/bill/RecurringService');
      const svc = new RecurringService(env.DB);
      const generated = await svc.tick();
      if (generated > 0) console.log(`[cron] generated ${generated} recurring bills`);
    } catch (err) {
      console.error('[cron] recurring tick error:', err);
    }
  },
};
