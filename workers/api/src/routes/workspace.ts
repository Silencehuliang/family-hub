/**
 * 工作台路由
 */
import { Hono } from 'hono';
import type { Env, HonoVars } from '../env';
import { ok } from '../utils/response';

export const workspaceRoutes = new Hono<{ Bindings: Env; Variables: HonoVars }>();

workspaceRoutes.get('/members', async (c) => {
  const { familyId } = c.var.auth;
  const { results } = await c.env.DB.prepare(
    'SELECT id, family_id, nickname, avatar_url, role, created_at FROM sys_member WHERE family_id = ? ORDER BY created_at ASC'
  ).bind(familyId).all();
  return ok(c, results ?? []);
});

workspaceRoutes.get('/summary', async (c) => {
  const { familyId } = c.var.auth;
  const month = new Date().toISOString().slice(0, 7);

  // 本月支出
  const spending = await c.env.DB.prepare(
    'SELECT COALESCE(SUM(amount), 0) as total FROM bill_record WHERE family_id = ? AND bill_date >= ? AND bill_date < ? AND deleted_at IS NULL'
  ).bind(familyId, `${month}-01`, `${month}-99`).first<{ total: number }>();

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
