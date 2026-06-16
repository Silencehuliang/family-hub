/**
 * 认证中间件
 * 校验会话 token(KV),注入 familyId/memberId/deviceId 到 c.var.auth
 * Token 来源: Authorization: Bearer <token> (兼容) 或 cookie: sess_token
 */
import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { ErrorCode, SESSION_TTL_SECONDS } from '@family-hub/shared';
import { BizError } from '../utils/response';
import type { Env, HonoVars } from '../env';

const SESSION_PREFIX = 'sess:';

const SESSION_COOKIE = 'sess_token';

/** 会话数据结构(存 KV) */
interface SessionData {
  memberId: string;
  familyId: string;
  role: string;
  deviceId: string;
  issuedAt: number;
}

/** 从请求中提取会话 token（header 优先，cookie 兜底） */
function extractToken(c: { req: { header: (name: string) => string | undefined } }): string | null {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const t = authHeader.slice(7);
    if (t) return t;
  }
  return getCookie(c as Parameters<typeof getCookie>[0], SESSION_COOKIE) ?? null;
}

/**
 * 认证中间件
 * 成功后在 c.var.auth 注入 AuthContext
 */
export const authMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: HonoVars }> = async (c, next) => {
  const token = extractToken(c);
  if (!token) {
    throw new BizError(ErrorCode.UNAUTHORIZED, '缺少认证令牌');
  }

  // 从 KV 读取会话
  const sessionKey = `${SESSION_PREFIX}${token}`;
  const session = await c.env.KV.get<SessionData>(sessionKey, 'json');

  if (!session) {
    throw new BizError(ErrorCode.UNAUTHORIZED, '会话已失效，请重新登录');
  }

  // 校验设备是否仍被信任(防御:设备被吊销后 token 仍存在 KV)
  // 管理员创建家庭时无设备绑定(deviceId 为空),跳过设备校验
  if (session.deviceId) {
    const device = await c.env.DB.prepare(
      'SELECT trusted FROM sys_device WHERE id = ?'
    ).bind(session.deviceId).first<{ trusted: number }>();

    if (!device || !device.trusted) {
      await c.env.KV.delete(sessionKey);
      throw new BizError(ErrorCode.DEVICE_UNTRUSTED, '设备已被管理员吊销');
    }

    // 更新设备最后活跃时间(不阻塞响应)
    c.executionCtx.waitUntil(
      c.env.DB.prepare(
        'UPDATE sys_device SET last_active_at = strftime(\'%s\',\'now\') WHERE id = ?'
      ).bind(session.deviceId).run()
    );
  }

  // 注入认证上下文
  c.set('auth', {
    memberId: session.memberId,
    familyId: session.familyId,
    role: session.role,
    deviceId: session.deviceId,
  });

  await next();
};

/**
 * 管理员权限守卫(在 authMiddleware 之后使用)
 */
export const adminOnly: MiddlewareHandler<{ Bindings: Env; Variables: HonoVars }> = async (c, next) => {
  const auth = c.var.auth;
  if (!auth || auth.role !== 'admin') {
    throw new BizError(ErrorCode.FORBIDDEN, '仅管理员可操作');
  }
  await next();
};

/**
 * 创建会话并存入 KV
 */
export async function createSession(
  kv: KVNamespace,
  data: Omit<SessionData, 'issuedAt'>,
): Promise<string> {
  // 生成随机 token
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  const token = [...arr].map((b) => b.toString(16).padStart(2, '0')).join('');

  const sessionData: SessionData = {
    ...data,
    issuedAt: Math.floor(Date.now() / 1000),
  };

  await kv.put(`${SESSION_PREFIX}${token}`, JSON.stringify(sessionData), {
    expirationTtl: SESSION_TTL_SECONDS,
  });

  return token;
}

/**
 * 设置会话 cookie（更新会话 TTL 并下发 cookie）
 */
export function setSessionCookie(c: { header: (name: string, value: string) => void }, token: string): void {
  c.header(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_SECONDS}`,
  );
}

/**
 * 清除会话 cookie（登出时调用）
 */
export function clearSessionCookie(c: { header: (name: string, value: string) => void }): void {
  c.header(
    'Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
  );
}

/**
 * 销毁会话
 */
export async function destroySession(kv: KVNamespace, token: string): Promise<void> {
  await kv.delete(`${SESSION_PREFIX}${token}`);
}
