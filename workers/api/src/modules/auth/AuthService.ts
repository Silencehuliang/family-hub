/**
 * 认证服务
 * 创建家庭、邀请码、兑换、登录、登出、修改 PIN、设备管理
 */
import { ErrorCode, INVITE_CHARS, INVITE_LENGTH } from '@family-hub/shared';
import type { Member, Family, Device } from '@family-hub/shared';
import { BizError } from '../../utils/response';
import { hashPin, verifyPin, nanoid } from '../../utils/crypto';
import { findOne, execute, now } from '../../db/client';
import { createSession, destroySession } from '../../middleware/auth';
import { recordPinFail, clearPinFail, isPinLocked } from './rateLimit';

const INVITE_KV_PREFIX = 'invite:';

interface InviteData {
  familyId: string;
  role: string;
  maxUses: number;
  usedCount: number;
  expiresAt: number;
}

export class AuthService {
  constructor(private db: D1Database, private kv: KVNamespace) {}

  // ──────────────────────────────────────────────────────────
  // 创建家庭(首成员 = 管理员, 同时绑定设备)
  // ──────────────────────────────────────────────────────────
  async createFamily(input: {
    familyName: string;
    nickname: string;
    pin: string;
    fingerprint: string;
    deviceName?: string;
  }): Promise<{ token: string; memberId: string }> {
    const familyId = nanoid();
    const memberId = nanoid();
    const deviceId = nanoid();
    const pinHash = hashPin(input.pin);
    const ts = now();

    // 事务:创建家庭 + 成员 + 设备
    await this.db.batch([
      this.db.prepare(
        'INSERT INTO sys_family (id, name, created_by, created_at) VALUES (?, ?, ?, ?)'
      ).bind(familyId, input.familyName, memberId, ts),
      this.db.prepare(
        'INSERT INTO sys_member (id, family_id, nickname, role, pin_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(memberId, familyId, input.nickname, 'admin', pinHash, ts),
      this.db.prepare(
        'INSERT INTO sys_device (id, member_id, fingerprint, device_name, last_active_at, trusted, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)'
      ).bind(deviceId, memberId, input.fingerprint, input.deviceName ?? null, ts, ts),
    ]);

    // 为新家庭复制一份系统分类
    await this.copyCategoriesToFamily(familyId);

    // 创建会话(带设备)
    const token = await createSession(this.kv, {
      memberId,
      familyId,
      role: 'admin',
      deviceId,
    });

    return { token, memberId };
  }

  // ──────────────────────────────────────────────────────────
  // 生成邀请码(管理员)
  // ──────────────────────────────────────────────────────────
  async createInvite(
    familyId: string,
    ttlHours: number = 24,
    maxUses: number = 1,
  ): Promise<{ code: string; expiresAt: number }> {
    const code = this.genCode();
    const expiresAt = Math.floor(Date.now() / 1000) + ttlHours * 3600;

    const inviteData: InviteData = {
      familyId,
      role: 'member',
      maxUses,
      usedCount: 0,
      expiresAt,
    };

    await this.kv.put(`${INVITE_KV_PREFIX}${code}`, JSON.stringify(inviteData), {
      expirationTtl: ttlHours * 3600,
    });

    return { code, expiresAt };
  }

  // ──────────────────────────────────────────────────────────
  // 兑换邀请码 + 设备绑定
  // ──────────────────────────────────────────────────────────
  async redeemInvite(input: {
    code: string;
    nickname: string;
    pin: string;
    fingerprint: string;
    deviceName?: string;
  }): Promise<{ token: string; memberId: string }> {
    // 1. 校验邀请码
    const kvKey = `${INVITE_KV_PREFIX}${input.code}`;
    const invite = await this.kv.get<InviteData>(kvKey, 'json');

    if (!invite) {
      throw new BizError(ErrorCode.INVITE_INVALID, '邀请码无效或已过期');
    }

    if (invite.usedCount >= invite.maxUses) {
      throw new BizError(ErrorCode.INVITE_INVALID, '邀请码已用尽');
    }

    if (Math.floor(Date.now() / 1000) > invite.expiresAt) {
      throw new BizError(ErrorCode.INVITE_INVALID, '邀请码已过期');
    }

    // 2. 检查设备是否已被其他成员绑定
    const existingDevice = await findOne<{ member_id: string }>(
      this.db,
      'SELECT member_id FROM sys_device WHERE fingerprint = ? AND trusted = 1',
      input.fingerprint,
    );
    if (existingDevice) {
      throw new BizError(ErrorCode.CONFLICT, '该设备已被其他成员绑定');
    }

    const memberId = nanoid();
    const deviceId = nanoid();
    const pinHash = hashPin(input.pin);
    const ts = now();

    // 3. 创建成员 + 设备
    await this.db.batch([
      this.db.prepare(
        'INSERT INTO sys_member (id, family_id, nickname, role, pin_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(memberId, invite.familyId, input.nickname, invite.role, pinHash, ts),
      this.db.prepare(
        'INSERT INTO sys_device (id, member_id, fingerprint, device_name, last_active_at, trusted, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)'
      ).bind(deviceId, memberId, input.fingerprint, input.deviceName ?? null, ts, ts),
    ]);

    // 4. 更新邀请码使用次数
    invite.usedCount += 1;
    await this.kv.put(kvKey, JSON.stringify(invite), {
      expirationTtl: Math.max(1, invite.expiresAt - ts),
    });

    // 5. 创建会话
    const token = await createSession(this.kv, {
      memberId,
      familyId: invite.familyId,
      role: invite.role,
      deviceId,
    });

    return { token, memberId };
  }

  // ──────────────────────────────────────────────────────────
  // PIN + 设备登录
  // ──────────────────────────────────────────────────────────
  async login(input: {
    fingerprint: string;
    pin: string;
    deviceName?: string;
  }): Promise<{ token: string; memberId: string }> {
    // 1. 查找已信任设备
    const device = await findOne<Device>(
      this.db,
      'SELECT * FROM sys_device WHERE fingerprint = ? AND trusted = 1',
      input.fingerprint,
    );

    if (!device) {
      throw new BizError(ErrorCode.DEVICE_UNTRUSTED, '该设备未被信任，请联系管理员邀请加入');
    }

    // 2. 检查 PIN 锁定
    if (await isPinLocked(this.kv, device.memberId)) {
      throw new BizError(ErrorCode.PIN_LOCKED, 'PIN 输入错误次数过多，账号已临时锁定');
    }

    // 3. 校验 PIN
    const member = await findOne<{ id: string; family_id: string; role: string; pin_hash: string }>(
      this.db,
      'SELECT id, family_id, role, pin_hash FROM sys_member WHERE id = ?',
      device.memberId,
    );

    if (!member) {
      throw new BizError(ErrorCode.NOT_FOUND, '成员不存在');
    }

    if (!verifyPin(input.pin, member.pin_hash)) {
      const remaining = await recordPinFail(this.kv, member.id);
      throw new BizError(
        ErrorCode.VALIDATION,
        remaining > 0 ? `PIN 错误，还可尝试 ${remaining} 次` : 'PIN 错误次数过多，已锁定 30 分钟',
      );
    }

    // 4. 登录成功,清除失败计数
    await clearPinFail(this.kv, member.id);

    // 5. 更新设备最后活跃
    await execute(
      this.db,
      'UPDATE sys_device SET last_active_at = ?, device_name = COALESCE(?, device_name) WHERE id = ?',
      now(),
      input.deviceName ?? null,
      device.id,
    );

    // 6. 创建会话
    const token = await createSession(this.kv, {
      memberId: member.id,
      familyId: member.family_id,
      role: member.role,
      deviceId: device.id,
    });

    return { token, memberId: member.id };
  }

  // ──────────────────────────────────────────────────────────
  // 登出
  // ──────────────────────────────────────────────────────────
  async logout(token: string): Promise<void> {
    await destroySession(this.kv, token);
  }

  // ──────────────────────────────────────────────────────────
  // 获取当前会话信息(/auth/me)
  // ──────────────────────────────────────────────────────────
  async getMe(memberId: string, familyId: string, deviceId: string): Promise<{
    member: Member;
    family: Family;
    device: Device | null;
  }> {
    const [member, family, device] = await Promise.all([
      findOne<Member>(this.db, 'SELECT * FROM sys_member WHERE id = ?', memberId),
      findOne<Family>(this.db, 'SELECT * FROM sys_family WHERE id = ?', familyId),
      deviceId ? findOne<Device>(this.db, 'SELECT * FROM sys_device WHERE id = ?', deviceId) : null,
    ]);

    if (!member) throw new BizError(ErrorCode.NOT_FOUND, '成员不存在');
    if (!family) throw new BizError(ErrorCode.NOT_FOUND, '家庭不存在');

    return { member, family, device };
  }

  // ──────────────────────────────────────────────────────────
  // 更新个人资料（昵称/头像）
  // ──────────────────────────────────────────────────────────
  async updateProfile(memberId: string, data: {
    nickname?: string;
    avatarBase64?: string;
  }): Promise<{ nickname: string; avatarUrl: string | null }> {
    const sets: string[] = [];
    const values: unknown[] = [];

    if (data.nickname !== undefined) {
      sets.push('nickname = ?');
      values.push(data.nickname);
    }
    if (data.avatarBase64 !== undefined) {
      // 空字符串 = 清除头像; 非空 = 更新头像
      sets.push('avatar_url = ?');
      values.push(data.avatarBase64 || null);
    }

    if (sets.length === 0) {
      throw new BizError(ErrorCode.VALIDATION, '没有需要更新的字段');
    }

    await execute(
      this.db,
      `UPDATE sys_member SET ${sets.join(', ')} WHERE id = ?`,
      ...values,
      memberId,
    );

    const updated = await findOne<{ nickname: string; avatar_url: string | null }>(
      this.db,
      'SELECT nickname, avatar_url FROM sys_member WHERE id = ?',
      memberId,
    );

    if (!updated) throw new BizError(ErrorCode.NOT_FOUND, '成员不存在');
    return { nickname: updated.nickname, avatarUrl: updated.avatar_url };
  }

  // ──────────────────────────────────────────────────────────
  // 设备指纹恢复会话（PWA 无 cookie 时兜底）
  // ──────────────────────────────────────────────────────────
  async restoreSession(fingerprint: string): Promise<{ token: string; memberId: string } | null> {
    const device = await findOne<{ id: string; member_id: string }>(
      this.db,
      'SELECT id, member_id FROM sys_device WHERE fingerprint = ? AND trusted = 1',
      fingerprint,
    );
    if (!device) return null;

    const member = await findOne<{ family_id: string; role: string }>(
      this.db,
      'SELECT family_id, role FROM sys_member WHERE id = ?',
      device.member_id,
    );
    if (!member) return null;

    const token = await createSession(this.kv, {
      memberId: device.member_id,
      familyId: member.family_id,
      role: member.role,
      deviceId: device.id,
    });

    return { token, memberId: device.member_id };
  }

  // ──────────────────────────────────────────────────────────
  // 修改 PIN
  // ──────────────────────────────────────────────────────────
  async changePin(memberId: string, oldPin: string, newPin: string): Promise<void> {
    const member = await findOne<{ pin_hash: string }>(
      this.db,
      'SELECT pin_hash FROM sys_member WHERE id = ?',
      memberId,
    );
    if (!member) throw new BizError(ErrorCode.NOT_FOUND, '成员不存在');

    if (!verifyPin(oldPin, member.pin_hash)) {
      throw new BizError(ErrorCode.VALIDATION, '原 PIN 错误');
    }

    await execute(this.db, 'UPDATE sys_member SET pin_hash = ? WHERE id = ?', hashPin(newPin), memberId);
  }

  // ──────────────────────────────────────────────────────────
  // 设备管理
  // ──────────────────────────────────────────────────────────
  async getMyDevices(memberId: string): Promise<Device[]> {
    const { findMany } = await import('../../db/client');
    return findMany<Device>(this.db, 'SELECT * FROM sys_device WHERE member_id = ? ORDER BY last_active_at DESC', memberId);
  }

  async getAllDevices(familyId: string): Promise<Array<Device & { nickname: string }>> {
    const { findMany } = await import('../../db/client');
    return findMany<Device & { nickname: string }>(
      this.db,
      `SELECT d.*, m.nickname FROM sys_device d
       JOIN sys_member m ON m.id = d.member_id
       WHERE m.family_id = ? ORDER BY d.last_active_at DESC`,
      familyId,
    );
  }

  async revokeDevice(deviceId: string, familyId: string, _requesterRole: string): Promise<void> {
    const device = await findOne<Device & { family_id: string }>(
      this.db,
      'SELECT d.*, m.family_id FROM sys_device d JOIN sys_member m ON m.id = d.member_id WHERE d.id = ?',
      deviceId,
    );
    if (!device) throw new BizError(ErrorCode.NOT_FOUND, '设备不存在');
    if (device.family_id !== familyId) throw new BizError(ErrorCode.FORBIDDEN, '无权操作该设备');

    await execute(this.db, 'UPDATE sys_device SET trusted = 0 WHERE id = ?', deviceId);
  }

  // ──────────────────────────────────────────────────────────
  // 内部辅助
  // ──────────────────────────────────────────────────────────
  private genCode(): string {
    const arr = new Uint8Array(INVITE_LENGTH);
    crypto.getRandomValues(arr);
    return [...arr].map((b) => INVITE_CHARS[b % INVITE_CHARS.length]).join('');
  }

  /** 复制系统分类到新家庭(一级 + 二级) */
  private async copyCategoriesToFamily(familyId: string): Promise<void> {
    const categories = await this.db.prepare(
      'SELECT * FROM bill_category WHERE family_id = ?'
    ).bind('system').all<{ id: string; family_id: string; level: number; name: string; parent_id: string | null; icon: string | null; color: string | null; sort: number }>();

    if (!categories.results?.length) return;

    const idMap = new Map<string, string>();
    const statements: D1PreparedStatement[] = [];

    // 先插一级
    for (const cat of categories.results.filter((c) => c.level === 1)) {
      const newId = `${cat.id}_${familyId.slice(0, 8)}`;
      idMap.set(cat.id, newId);
      statements.push(
        this.db.prepare(
          'INSERT INTO bill_category (id, family_id, level, name, icon, color, sort) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(newId, familyId, cat.level, cat.name, cat.icon, cat.color, cat.sort),
      );
    }

    // 再插二级(带 parent_id 映射)
    for (const cat of categories.results.filter((c) => c.level === 2)) {
      const newId = `${cat.id}_${familyId.slice(0, 8)}`;
      const newParentId = cat.parent_id ? idMap.get(cat.parent_id) ?? cat.parent_id : null;
      statements.push(
        this.db.prepare(
          'INSERT INTO bill_category (id, family_id, level, name, parent_id, icon, color, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(newId, familyId, cat.level, cat.name, newParentId, cat.icon, cat.color, cat.sort),
      );
    }

    // 批量执行(事务)
    await this.db.batch(statements);
  }
}
