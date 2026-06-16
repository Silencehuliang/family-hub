/**
 * Cloudflare Workers 环境绑定类型
 */
export interface Env {
  // 绑定
  DB: D1Database;
  // BUCKET: R2Bucket;   // ⚠️ 暂未启用 R2，使用时取消注释
  KV: KVNamespace;

  // 非敏感变量
  APP_BASE_URL: string;
  VAPID_PUBLIC_KEY: string;

  // Secrets(用 wrangler secret put 设置)
  VAPID_PRIVATE_KEY?: string;
  CONFIG_ENCRYPTION_KEY?: string;
}

/** 认证上下文,由 auth 中间件注入到 c.var */
export interface AuthContext {
  memberId: string;
  familyId: string;
  role: string;
  deviceId: string;
}

/** Hono 上下文变量类型 */
export interface HonoVars {
  auth: AuthContext;
  env: Env;
}
