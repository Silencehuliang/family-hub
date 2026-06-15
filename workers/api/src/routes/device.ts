/**
 * 设备管理路由(需认证)
 */
import { Hono } from 'hono';
import { revokeDeviceSchema } from '@family-hub/shared';
import { AuthService } from '../modules/auth/AuthService';
import { ok } from '../utils/response';
import { adminOnly } from '../middleware/auth';
import type { Env, HonoVars } from '../env';

export const deviceRoutes = new Hono<{ Bindings: Env; Variables: HonoVars }>();

// ── 我的设备列表 ───────────────────────────────────────────────
deviceRoutes.get('/', async (c) => {
  const { memberId } = c.var.auth;
  const svc = new AuthService(c.env.DB, c.env.KV);
  const devices = await svc.getMyDevices(memberId);
  return ok(c, devices);
});

// ── 吊销设备 ───────────────────────────────────────────────────
deviceRoutes.post('/revoke', async (c) => {
  const body = await c.req.json();
  const input = revokeDeviceSchema.parse(body);
  const { familyId, role } = c.var.auth;
  const svc = new AuthService(c.env.DB, c.env.KV);
  await svc.revokeDevice(input.deviceId, familyId, role);
  return ok(c, { success: true });
});

// ── 全部设备(管理员) ──────────────────────────────────────────
const adminRoutes = new Hono<{ Bindings: Env; Variables: HonoVars }>();
adminRoutes.use('*', adminOnly);

adminRoutes.get('/', async (c) => {
  const { familyId } = c.var.auth;
  const svc = new AuthService(c.env.DB, c.env.KV);
  const devices = await svc.getAllDevices(familyId);
  return ok(c, devices);
});

// 把管理员路由挂到 deviceRoutes
deviceRoutes.route('/admin', adminRoutes);
