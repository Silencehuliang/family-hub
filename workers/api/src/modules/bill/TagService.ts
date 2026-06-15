/**
 * 标签服务
 * 列表、新建、归档
 */
import { ErrorCode } from '@family-hub/shared';
import type { BillTag } from '@family-hub/shared';
import { BizError } from '../../utils/response';
import { findMany, findOne, execute, now } from '../../db/client';
import { nanoid } from '../../utils/crypto';

export class TagService {
  constructor(private db: D1Database) {}

  /** 获取家庭的标签列表 */
  async list(familyId: string, includeArchived = false): Promise<BillTag[]> {
    const sql = includeArchived
      ? 'SELECT * FROM bill_tag WHERE family_id = ? ORDER BY name'
      : 'SELECT * FROM bill_tag WHERE family_id = ? AND archived = 0 ORDER BY name';
    return findMany<BillTag>(this.db, sql, familyId);
  }

  /** 新建标签 */
  async create(familyId: string, input: { name: string; color?: string }): Promise<BillTag> {
    // 检查同名
    const existing = await findOne<BillTag>(
      this.db,
      'SELECT * FROM bill_tag WHERE family_id = ? AND name = ?',
      familyId,
      input.name,
    );
    if (existing) throw new BizError(ErrorCode.CONFLICT, '标签已存在');

    const id = nanoid();
    const ts = now();

    await execute(
      this.db,
      'INSERT INTO bill_tag (id, family_id, name, color, created_at) VALUES (?, ?, ?, ?, ?)',
      id, familyId, input.name, input.color ?? '#FF8C42', ts,
    );

    return findOne<BillTag>(this.db, 'SELECT * FROM bill_tag WHERE id = ?', id) as Promise<BillTag>;
  }

  /** 归档标签 */
  async archive(tagId: string, familyId: string): Promise<void> {
    const tag = await findOne<BillTag>(
      this.db,
      'SELECT * FROM bill_tag WHERE id = ? AND family_id = ?',
      tagId,
      familyId,
    );
    if (!tag) throw new BizError(ErrorCode.NOT_FOUND, '标签不存在');

    await execute(this.db, 'UPDATE bill_tag SET archived = 1 WHERE id = ?', tagId);
  }
}
