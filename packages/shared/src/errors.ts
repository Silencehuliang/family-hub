/**
 * 业务错误码(前后端共享)
 */
export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED', // 未登录 / 会话失效
  DEVICE_UNTRUSTED: 'DEVICE_UNTRUSTED', // 设备未信任
  PIN_LOCKED: 'PIN_LOCKED', // PIN 锁定
  INVITE_INVALID: 'INVITE_INVALID', // 邀请码无效/过期/用尽
  FORBIDDEN: 'FORBIDDEN', // 无权限
  VALIDATION: 'VALIDATION', // 参数校验失败
  NOT_FOUND: 'NOT_FOUND', // 资源不存在
  CONFLICT: 'CONFLICT', // 冲突(如重复)
  FEISHU_ERROR: 'FEISHU_ERROR', // 飞书推送失败
  INTERNAL: 'INTERNAL', // 内部错误
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** HTTP 状态码映射 */
export const errorStatus: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  DEVICE_UNTRUSTED: 401,
  PIN_LOCKED: 423,
  INVITE_INVALID: 400,
  FORBIDDEN: 403,
  VALIDATION: 422,
  NOT_FOUND: 404,
  CONFLICT: 409,
  FEISHU_ERROR: 502,
  INTERNAL: 500,
};
