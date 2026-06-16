/**
 * Zod 校验 schema(前后端共享,保证入参一致性)
 */
import { z } from 'zod';

/** 设备指纹:sha256 十六进制,64 位 */
const fingerprintSchema = z.string().regex(/^[a-f0-9]{64}$/, '无效的设备指纹');

/** PIN:4~6 位数字 */
const pinSchema = z
  .string()
  .regex(/^\d{4,6}$/, 'PIN 必须为 4~6 位数字');

/** 创建家庭(首成员=管理员) */
export const createFamilySchema = z.object({
  familyName: z.string().min(1).max(50),
  nickname: z.string().min(1).max(30),
  pin: pinSchema,
  fingerprint: fingerprintSchema,
  deviceName: z.string().max(120).optional(),
});
export type CreateFamilyInput = z.infer<typeof createFamilySchema>;

/** 兑换邀请码 + 设备绑定 */
export const redeemInviteSchema = z.object({
  code: z.string().regex(/^[A-Z0-9]{6}$/, '邀请码格式错误'),
  nickname: z.string().min(1).max(30),
  pin: pinSchema,
  fingerprint: fingerprintSchema,
  deviceName: z.string().max(120).optional(),
});
export type RedeemInviteInput = z.infer<typeof redeemInviteSchema>;

/** 创建邀请码(管理员) */
export const createInviteSchema = z.object({
  ttlHours: z.number().int().min(1).max(168).default(24),
  maxUses: z.number().int().min(1).max(20).default(1),
});
export type CreateInviteInput = z.infer<typeof createInviteSchema>;

/** PIN + 设备登录 */
export const loginSchema = z.object({
  fingerprint: fingerprintSchema,
  pin: pinSchema,
  deviceName: z.string().max(120).optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** 修改 PIN */
export const changePinSchema = z.object({
  oldPin: pinSchema,
  newPin: pinSchema,
});
export type ChangePinInput = z.infer<typeof changePinSchema>;

/** 吊销设备 */
export const revokeDeviceSchema = z.object({
  deviceId: z.string().min(1),
});
export type RevokeDeviceInput = z.infer<typeof revokeDeviceSchema>;

// ═══════════════════════════════════════════════════════════════
// 账单相关 schema
// ═══════════════════════════════════════════════════════════════

/** 创建账单 */
export const createBillSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  categoryL1: z.string().min(1),
  categoryL2: z.string().min(1),
  payerId: z.string().min(1),
  billDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式 YYYY-MM-DD'),
  note: z.string().max(200).optional(),
  tags: z.array(z.string()).optional(),
});
export type CreateBillInput = z.infer<typeof createBillSchema>;

/** 更新账单 */
export const updateBillSchema = createBillSchema.partial();
export type UpdateBillInput = z.infer<typeof updateBillSchema>;

/** 创建标签 */
export const createBillTagSchema = z.object({
  name: z.string().min(1).max(20),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#FF8C42'),
});
export type CreateBillTagInput = z.infer<typeof createBillTagSchema>;

/** 创建二级分类 */
export const createBillCategorySchema = z.object({
  parentId: z.string().min(1),
  name: z.string().min(1).max(20),
  icon: z.string().max(4).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});
export type CreateBillCategoryInput = z.infer<typeof createBillCategorySchema>;

/** 设置预算 */
export const setBillBudgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, '月份格式 YYYY-MM'),
  categoryL1: z.string().optional(), // 不填 = 总预算
  amount: z.number().positive().max(10_000_000),
});
export type SetBillBudgetInput = z.infer<typeof setBillBudgetSchema>;

/** 创建周期账单 */
export const createBillRecurringSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  categoryL1: z.string().min(1),
  categoryL2: z.string().min(1),
  payerId: z.string().min(1),
  cycle: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  nextDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(200).optional(),
});
export type CreateBillRecurringInput = z.infer<typeof createBillRecurringSchema>;

/** 导入 CSV 行 */
const importCsvRowSchema = z.object({
  billDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式 YYYY-MM-DD'),
  amount: z.number().positive(),
  categoryL1: z.string().min(1),
  categoryL2: z.string().min(1),
  payerName: z.string().min(1),
  note: z.string().max(200).optional(),
});

/** 导入确认 */
export const billImportConfirmSchema = z.object({
  rows: z.array(importCsvRowSchema).min(1, '无数据可导入'),
  skipFailed: z.boolean().default(true),
});
export type BillImportConfirmInput = z.infer<typeof billImportConfirmSchema>;

// ═══════════════════════════════════════════════════════════════
// 待办相关 schema
// ═══════════════════════════════════════════════════════════════

/** 创建待办 */
export const createTodoSchema = z.object({
  title: z.string().min(1).max(100),
  note: z.string().max(500).optional(),
  priority: z.enum(['high', 'mid', 'low']).default('mid'),
  dueAt: z.number().positive().optional(),
  assigneeIds: z.array(z.string()).optional(),
  subtasks: z.array(z.object({ title: z.string().min(1).max(100) })).optional(),
});
export type CreateTodoInput = z.infer<typeof createTodoSchema>;

/** 更新待办 */
export const updateTodoSchema = createTodoSchema.partial();
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

/** 修改待办状态 */
export const setTodoStatusSchema = z.object({
  status: z.enum(['todo', 'doing', 'done']),
});
export type SetTodoStatusInput = z.infer<typeof setTodoStatusSchema>;

/** 添加子任务 */
export const createSubtaskSchema = z.object({
  title: z.string().min(1).max(100),
});
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;

// ═══════════════════════════════════════════════════════════════
// 购物清单相关 schema
// ═══════════════════════════════════════════════════════════════

/** 创建购物清单 */
export const createShopListSchema = z.object({
  name: z.string().min(1).max(50),
});
export type CreateShopListInput = z.infer<typeof createShopListSchema>;

/** 添加商品 */
export const createShopItemSchema = z.object({
  name: z.string().min(1).max(100),
  qty: z.number().positive().default(1),
  unit: z.string().max(10).default('个'),
  estPrice: z.number().positive().optional(),
  category: z.string().max(20).optional(),
  priority: z.enum(['high', 'mid', 'low']).default('mid'),
  note: z.string().max(200).optional(),
});
export type CreateShopItemInput = z.infer<typeof createShopItemSchema>;

/** 更新商品 */
export const updateShopItemSchema = createShopItemSchema.partial();
export type UpdateShopItemInput = z.infer<typeof updateShopItemSchema>;

/** 购买商品 */
export const buyShopItemSchema = z.object({
  actualPrice: z.number().positive(),
  buyerId: z.string().min(1),
});
export type BuyShopItemInput = z.infer<typeof buyShopItemSchema>;

/** 联动账单 */
export const shopToBillSchema = z.object({
  categoryL1: z.string().min(1).default('cat_daily'),
  categoryL2: z.string().min(1).default('cat_daily_paper'),
  payerId: z.string().min(1),
});
export type ShopToBillInput = z.infer<typeof shopToBillSchema>;

// ═══════════════════════════════════════════════════════════════
// 日程相关 schema
// ═══════════════════════════════════════════════════════════════

/** 创建日程 */
export const createEventSchema = z.object({
  title: z.string().min(1).max(100),
  type: z.enum(['birthday', 'anniversary', 'medical', 'bill', 'travel', 'id_expiring', 'other']),
  startAt: z.number().positive(),
  endAt: z.number().positive().optional(),
  allDay: z.boolean().default(false),
  location: z.string().max(200).optional(),
  note: z.string().max(500).optional(),
  repeatRule: z.string().max(50).optional(),
  participantIds: z.array(z.string()).optional(),
  reminderOffsets: z.array(z.number().int()).optional(),
});
export type CreateEventInput = z.infer<typeof createEventSchema>;

/** 更新日程 */
export const updateEventSchema = createEventSchema.partial();
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

/** 月历查询 */
export const calendarQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, '月份格式 YYYY-MM'),
});
export type CalendarQueryInput = z.infer<typeof calendarQuerySchema>;
