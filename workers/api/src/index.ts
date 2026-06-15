/**
 * Cloudflare Workers 入口
 * Hono 应用 + 认证路由 + Cron 定时任务占位
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, HonoVars } from './env';
import { errorMiddleware } from './middleware/error';
import { logMiddleware } from './middleware/log';
import { authMiddleware } from './middleware/auth';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { deviceRoutes } from './routes/device';

const app = new Hono<{ Bindings: Env; Variables: HonoVars }>();

// ── 全局中间件 ─────────────────────────────────────────────────
app.use('*', logMiddleware);
app.use('*', errorMiddleware);
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

// ── 工作台摘要(占位,Phase 2 启用) ─────────────────────────────
app.get('/api/workspace/summary', async (c) => {
  // TODO: Phase 2 实现
  return c.json({
    data: {
      monthSpending: 0,
      monthBudget: 0,
      todayReminders: [],
      pendingShopCount: 0,
      upcomingEvents: [],
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

  async scheduled(event: ScheduledEvent, _env: Env, _ctx: ExecutionContext) {
    // Phase 5 实现:
    // ctx.waitUntil(Promise.all([
    //   notifyDispatcher.checkEvents(),
    //   notifyDispatcher.checkTodos(),
    //   billRecurringService.tick(),
    //   billBudgetService.checkOverBudget(),
    // ]));
    console.log('[cron] scheduled event triggered:', event.cron);
  },
};
