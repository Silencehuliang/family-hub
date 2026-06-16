/**
 * 认证路由(无需中间件,公开访问)
 */
import { Hono } from 'hono';
import { createFamilySchema, redeemInviteSchema, loginSchema, createInviteSchema, changePinSchema } from '@family-hub/shared';
import { ok } from '../utils/response';
import { createAuthService } from '../utils/serviceFactory';
import { authMiddleware, adminOnly, setSessionCookie, clearSessionCookie } from '../middleware/auth';
import type { Env, HonoVars } from '../env';

export const authRoutes = new Hono<{ Bindings: Env; Variables: HonoVars }>();

// ── 创建家庭(首成员 = 管理员) ──────────────────────────────────
authRoutes.post('/create-family', async (c) => {
  const body = await c.req.json();
  const input = createFamilySchema.parse(body);
  const svc = createAuthService(c.env.DB, c.env.KV);
  const result = await svc.createFamily(input);
  setSessionCookie(c, result.token);
  return c.json({ data: { memberId: result.memberId } }, 201);
});

// ── 兑换邀请码 + 设备绑定 ──────────────────────────────────────
authRoutes.post('/invite/redeem', async (c) => {
  const body = await c.req.json();
  const input = redeemInviteSchema.parse(body);
  const svc = createAuthService(c.env.DB, c.env.KV);
  const result = await svc.redeemInvite(input);
  setSessionCookie(c, result.token);
  return c.json({ data: { memberId: result.memberId } }, 201);
});

// ── PIN + 设备登录 ─────────────────────────────────────────────
authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const input = loginSchema.parse(body);
  const svc = createAuthService(c.env.DB, c.env.KV);
  const result = await svc.login(input);
  setSessionCookie(c, result.token);
  return ok(c, { memberId: result.memberId });
});

// ── 设备指纹恢复会话（公开，无需 cookie） ─────────────────────
authRoutes.post('/restore', async (c) => {
  const body = await c.req.json();
  const { fingerprint } = body as { fingerprint: string };
  if (!fingerprint) return c.json({ error: { code: 'VALIDATION', message: '缺少设备指纹' } }, 422 as const);
  const svc = createAuthService(c.env.DB, c.env.KV);
  const result = await svc.restoreSession(fingerprint);
  if (!result) return c.json({ error: { code: 'NOT_FOUND', message: '无可恢复的会话' } }, 404 as const);
  setSessionCookie(c, result.token);
  return c.json({ data: { restored: true } });
});

// ── 以下需要认证 ───────────────────────────────────────────────
authRoutes.use('/me', authMiddleware);
authRoutes.use('/logout', authMiddleware);
authRoutes.use('/pin', authMiddleware);
authRoutes.use('/invite/create', authMiddleware, adminOnly);

// ── 获取当前会话信息 ───────────────────────────────────────────
authRoutes.get('/me', async (c) => {
  const { memberId, familyId, deviceId } = c.var.auth;
  const svc = createAuthService(c.env.DB, c.env.KV);
  const result = await svc.getMe(memberId, familyId, deviceId);
  return ok(c, result);
});

// ── 登出 ───────────────────────────────────────────────────────
authRoutes.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.slice(7) ?? '';
  const svc = createAuthService(c.env.DB, c.env.KV);
  await svc.logout(token);
  clearSessionCookie(c);
  return ok(c, { success: true });
});

// ── 修改 PIN ───────────────────────────────────────────────────
authRoutes.post('/pin', async (c) => {
  const body = await c.req.json();
  const input = changePinSchema.parse(body);
  const { memberId } = c.var.auth;
  const svc = createAuthService(c.env.DB, c.env.KV);
  await svc.changePin(memberId, input.oldPin, input.newPin);
  return ok(c, { success: true });
});

// ── 生成邀请码(管理员) ────────────────────────────────────────
authRoutes.post('/invite/create', async (c) => {
  const body = await c.req.json();
  const input = createInviteSchema.parse(body);
  const { familyId } = c.var.auth;
  const svc = createAuthService(c.env.DB, c.env.KV);
  const result = await svc.createInvite(familyId, input.ttlHours, input.maxUses);
  return c.json({ data: result }, 201);
});
