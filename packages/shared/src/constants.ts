/**
 * 全局常量
 */

/** 品牌主色 */
export const BRAND_COLOR = '#FF8C42';

/** PIN 限流策略 */
export const PIN_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_SECONDS: 10 * 60, // 10 分钟
  LOCK_SECONDS: 30 * 60, // 锁定 30 分钟
} as const;

/** 会话 token TTL */
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 天

/** 邀请码字符集(去除易混淆 0/O/1/I/L) */
export const INVITE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const INVITE_LENGTH = 6;

/** system family id(内置分类挂在它下面,家庭创建后复制一份) */
export const SYSTEM_FAMILY_ID = 'system';

/** 分类默认色板(14 一级分类) */
export const CATEGORY_COLORS: Record<string, string> = {
  cat_food: '#FF7A45',
  cat_daily: '#13C2C2',
  cat_utility: '#FAAD14',
  cat_clothing: '#FF85C0',
  cat_medical: '#FF4D4F',
  cat_transport: '#1890FF',
  cat_edu: '#722ED1',
  cat_fun: '#EB2F96',
  cat_digital: '#2F54EB',
  cat_housing: '#87D068',
  cat_baby: '#FFA940',
  cat_gift: '#A0522D',
  cat_finance: '#08979C',
  cat_other: '#8C8C8C',
};

/** 响应式断点 */
export const BREAKPOINT_MOBILE = 768;
