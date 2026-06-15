/**
 * 全局枚举与常量定义(前后端共享)
 */

/** 成员角色 */
export const Role = {
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

/** 待办状态 */
export const TodoStatus = {
  TODO: 'todo',
  DOING: 'doing',
  DONE: 'done',
} as const;
export type TodoStatus = (typeof TodoStatus)[keyof typeof TodoStatus];

/** 优先级 */
export const Priority = {
  HIGH: 'high',
  MID: 'mid',
  LOW: 'low',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

/** 购物清单状态 */
export const ShopListStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  DONE: 'done',
} as const;
export type ShopListStatus = (typeof ShopListStatus)[keyof typeof ShopListStatus];

/** 日程类型 */
export const EventType = {
  BIRTHDAY: 'birthday',
  ANNIVERSARY: 'anniversary',
  MEDICAL: 'medical',
  BILL: 'bill',
  TRAVEL: 'travel',
  ID_EXPIRING: 'id_expiring',
  OTHER: 'other',
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];

/** 通知类型 */
export const NotifyType = {
  BILL_OVER: 'bill_over',
  BILL_RECURRING: 'bill_recurring',
  TODO_DUE: 'todo_due',
  EVENT: 'event',
  SHOP: 'shop',
  DEVICE_LOGIN: 'device_login',
} as const;
export type NotifyType = (typeof NotifyType)[keyof typeof NotifyType];

/** 周期类型 */
export const Cycle = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;
export type Cycle = (typeof Cycle)[keyof typeof Cycle];

/** 设备信任状态 */
export const DeviceTrusted = {
  TRUSTED: 1,
  REVOKED: 0,
} as const;
