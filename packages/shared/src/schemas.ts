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
