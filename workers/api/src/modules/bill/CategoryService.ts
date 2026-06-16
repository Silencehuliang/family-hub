/**
 * 分类服务
 * 获取分类树、新建二级分类、编辑分类、隐藏分类
 */
import { ErrorCode } from '@family-hub/shared';
import type { BillCategory } from '@family-hub/shared';
import { BizError } from '../../utils/response';
import { findOne, findMany, execute, now } from '../../db/client';
import { nanoid } from '../../utils/crypto';

/** D1 snake_case → TS camelCase 映射 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCategory(row: any): BillCategory {
  return {
    id: row.id,
    familyId: row.family_id ?? row.familyId,
    level: row.level,
    name: row.name,
    parentId: row.parent_id ?? row.parentId,
    icon: row.icon,
    color: row.color,
    sort: row.sort,
    hidden: Boolean(row.hidden),
  };
}

export class CategoryService {
  constructor(private db: D1Database) {}

  /** 获取家庭的分类树(一级 + 二级) */
  async getTree(familyId: string): Promise<{ l1: BillCategory[]; l2: BillCategory[] }> {
    const [l1Raw, l2Raw] = await Promise.all([
      findMany<Record<string, unknown>>(
        this.db,
        'SELECT * FROM bill_category WHERE family_id = ? AND level = 1 ORDER BY sort',
        familyId,
      ),
      findMany<Record<string, unknown>>(
        this.db,
        'SELECT * FROM bill_category WHERE family_id = ? AND level = 2 ORDER BY sort',
        familyId,
      ),
    ]);
    return { l1: l1Raw.map(mapCategory), l2: l2Raw.map(mapCategory) };
  }

  /** 新建二级分类 */
  async create(familyId: string, input: { parentId: string; name: string; icon?: string; color?: string }): Promise<BillCategory> {
    // 校验一级分类存在且属于该家庭
    const parent = await findOne<BillCategory>(
      this.db,
      'SELECT * FROM bill_category WHERE id = ? AND family_id = ? AND level = 1',
      input.parentId,
      familyId,
    );
    if (!parent) throw new BizError(ErrorCode.NOT_FOUND, '一级分类不存在');

    // 检查同名
    const existing = await findOne<BillCategory>(
      this.db,
      'SELECT * FROM bill_category WHERE family_id = ? AND parent_id = ? AND name = ?',
      familyId,
      input.parentId,
      input.name,
    );
    if (existing) throw new BizError(ErrorCode.CONFLICT, '同级已存在同名分类');

    const id = nanoid();
    const ts = now();

    await execute(
      this.db,
      'INSERT INTO bill_category (id, family_id, level, name, parent_id, icon, color, sort, created_at) VALUES (?, ?, 2, ?, ?, ?, ?, 99, ?)',
      id, familyId, input.name, input.parentId, input.icon ?? null, input.color ?? null, ts,
    );

    return findOne<Record<string, unknown>>(this.db, 'SELECT * FROM bill_category WHERE id = ?', id).then((r) => r ? mapCategory(r) : null) as Promise<BillCategory>;
  }

  /** 编辑分类(名称/图标/颜色) */
  async update(categoryId: string, familyId: string, input: { name?: string; icon?: string; color?: string }): Promise<void> {
    const cat = await findOne<BillCategory>(
      this.db,
      'SELECT * FROM bill_category WHERE id = ? AND family_id = ?',
      categoryId,
      familyId,
    );
    if (!cat) throw new BizError(ErrorCode.NOT_FOUND, '分类不存在');

    const sets: string[] = [];
    const params: unknown[] = [];
    if (input.name !== undefined) { sets.push('name = ?'); params.push(input.name); }
    if (input.icon !== undefined) { sets.push('icon = ?'); params.push(input.icon); }
    if (input.color !== undefined) { sets.push('color = ?'); params.push(input.color); }
    if (sets.length === 0) return;

    params.push(categoryId);
    await execute(this.db, `UPDATE bill_category SET ${sets.join(', ')} WHERE id = ?`, ...params);
  }

  /** 隐藏/显示分类 */
  async setHidden(categoryId: string, familyId: string, hidden: boolean): Promise<void> {
    const cat = await findOne<BillCategory>(
      this.db,
      'SELECT * FROM bill_category WHERE id = ? AND family_id = ?',
      categoryId,
      familyId,
    );
    if (!cat) throw new BizError(ErrorCode.NOT_FOUND, '分类不存在');

    await execute(this.db, 'UPDATE bill_category SET hidden = ? WHERE id = ?', hidden ? 1 : 0, categoryId);
  }
}
