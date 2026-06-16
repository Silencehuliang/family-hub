/**
 * 账单核心服务
 * CRUD、统计、导出
 */
import { ErrorCode } from '@family-hub/shared';
import type { BillRecord, BillTag, BillStats } from '@family-hub/shared';
import { BizError } from '../../utils/response';
import { findOne, findMany, execute, batchExecute, now } from '../../db/client';
import { nanoid } from '../../utils/crypto';
import { camelCase, camelCaseAll } from '../../utils/mapper';

/** 账单列表查询参数 */
export interface BillQuery {
  from?: string;
  to?: string;
  categoryL1?: string;
  payerId?: string;
  tagId?: string;
  page?: number;
  pageSize?: number;
}

export class BillService {
  constructor(private db: D1Database) {}

  // ──────────────────────────────────────────────────────────
  // 列表查询(带筛选 + 标签 JOIN)
  // ──────────────────────────────────────────────────────────
  async list(familyId: string, query: BillQuery): Promise<{ items: Array<BillRecord & { tags: BillTag[] }>; total: number }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    // 构建 WHERE 条件
    const conditions: string[] = ['b.family_id = ?', 'b.deleted_at IS NULL'];
    const params: unknown[] = [familyId];

    if (query.from) { conditions.push('b.bill_date >= ?'); params.push(query.from); }
    if (query.to) { conditions.push('b.bill_date <= ?'); params.push(query.to); }
    if (query.categoryL1) { conditions.push('b.category_l1 = ?'); params.push(query.categoryL1); }
    if (query.payerId) { conditions.push('b.payer_id = ?'); params.push(query.payerId); }

    let joinClause = '';
    if (query.tagId) {
      joinClause = 'JOIN bill_record_tag rt ON rt.record_id = b.id';
      conditions.push('rt.tag_id = ?');
      params.push(query.tagId);
    }

    const where = conditions.join(' AND ');

    // 查询总数
    const countResult = await this.db.prepare(
      `SELECT COUNT(DISTINCT b.id) as cnt FROM bill_record b ${joinClause} WHERE ${where}`
    ).bind(...params).first<{ cnt: number }>();
    const total = countResult?.cnt ?? 0;

    // 查询列表(D1 返回 snake_case,映射为 camelCase)
    const rawItems = await findMany<Record<string, unknown>>(
      this.db,
      `SELECT DISTINCT b.* FROM bill_record b ${joinClause} WHERE ${where} ORDER BY b.bill_date DESC, b.created_at DESC LIMIT ? OFFSET ?`,
      ...params, pageSize, offset,
    );
    const items = camelCaseAll<BillRecord>(rawItems);

    // 批量查询标签
    if (items.length === 0) return { items: [], total: 0 };

    const recordIds = items.map((r) => r.id);
    const placeholders = recordIds.map(() => '?').join(',');
    const tagRows = await findMany<Record<string, unknown>>(
      this.db,
      `SELECT t.*, rt.record_id FROM bill_tag t JOIN bill_record_tag rt ON rt.tag_id = t.id WHERE rt.record_id IN (${placeholders})`,
      ...recordIds,
    );

    const tagMap = new Map<string, BillTag[]>();
    for (const tr of tagRows) {
      const tag = camelCase<BillTag & { record_id: string }>(tr);
      const recordId = (tr as { record_id: string }).record_id;
      if (!tagMap.has(recordId)) tagMap.set(recordId, []);
      tagMap.get(recordId)!.push({ id: tag.id, familyId: tag.familyId, name: tag.name, color: tag.color, archived: Boolean(tag.archived) });
    }

    return {
      items: items.map((r) => ({ ...r, tags: tagMap.get(r.id) ?? [] })),
      total,
    };
  }

  // ──────────────────────────────────────────────────────────
  // 详情
  // ──────────────────────────────────────────────────────────
  async getById(id: string, familyId: string): Promise<BillRecord & { tags: BillTag[] }> {
    const raw = await findOne<Record<string, unknown>>(
      this.db,
      'SELECT * FROM bill_record WHERE id = ? AND family_id = ? AND deleted_at IS NULL',
      id,
      familyId,
    );
    if (!raw) throw new BizError(ErrorCode.NOT_FOUND, '账单不存在');
    const record = camelCase<BillRecord>(raw);

    const rawTags = await findMany<Record<string, unknown>>(
      this.db,
      'SELECT t.* FROM bill_tag t JOIN bill_record_tag rt ON rt.tag_id = t.id WHERE rt.record_id = ?',
      id,
    );
    const tags = camelCaseAll<BillTag>(rawTags);

    return { ...record, tags };
  }

  // ──────────────────────────────────────────────────────────
  // 创建
  // ──────────────────────────────────────────────────────────
  async create(familyId: string, memberId: string, input: {
    amount: number;
    categoryL1: string;
    categoryL2: string;
    payerId: string;
    billDate: string;
    note?: string;
    tags?: string[];
  }): Promise<BillRecord> {
    const id = nanoid();
    const ts = now();

    // 插入记录
    await execute(
      this.db,
      `INSERT INTO bill_record (id, family_id, amount, category_l1, category_l2, payer_id, bill_date, note, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, familyId, input.amount, input.categoryL1, input.categoryL2, input.payerId, input.billDate, input.note ?? null, memberId, ts, ts,
    );

    // 插入标签关联
    if (input.tags && input.tags.length > 0) {
      const stmts = input.tags.map((tagId) => ({
        sql: 'INSERT OR IGNORE INTO bill_record_tag (record_id, tag_id) VALUES (?, ?)',
        params: [id, tagId],
      }));
      await batchExecute(this.db, stmts);
    }

    return this.getById(id, familyId);
  }

  // ──────────────────────────────────────────────────────────
  // 修改
  // ──────────────────────────────────────────────────────────
  async update(id: string, familyId: string, input: {
    amount?: number;
    categoryL1?: string;
    categoryL2?: string;
    payerId?: string;
    billDate?: string;
    note?: string;
    tags?: string[];
  }): Promise<BillRecord> {
    const record = await findOne<BillRecord>(
      this.db,
      'SELECT * FROM bill_record WHERE id = ? AND family_id = ? AND deleted_at IS NULL',
      id,
      familyId,
    );
    if (!record) throw new BizError(ErrorCode.NOT_FOUND, '账单不存在');

    const sets: string[] = ['updated_at = ?'];
    const params: unknown[] = [now()];

    if (input.amount !== undefined) { sets.push('amount = ?'); params.push(input.amount); }
    if (input.categoryL1 !== undefined) { sets.push('category_l1 = ?'); params.push(input.categoryL1); }
    if (input.categoryL2 !== undefined) { sets.push('category_l2 = ?'); params.push(input.categoryL2); }
    if (input.payerId !== undefined) { sets.push('payer_id = ?'); params.push(input.payerId); }
    if (input.billDate !== undefined) { sets.push('bill_date = ?'); params.push(input.billDate); }
    if (input.note !== undefined) { sets.push('note = ?'); params.push(input.note); }

    params.push(id);
    await execute(this.db, `UPDATE bill_record SET ${sets.join(', ')} WHERE id = ?`, ...params);

    // 更新标签
    if (input.tags !== undefined) {
      await execute(this.db, 'DELETE FROM bill_record_tag WHERE record_id = ?', id);
      if (input.tags.length > 0) {
        const stmts = input.tags.map((tagId) => ({
          sql: 'INSERT OR IGNORE INTO bill_record_tag (record_id, tag_id) VALUES (?, ?)',
          params: [id, tagId],
        }));
        await batchExecute(this.db, stmts);
      }
    }

    return this.getById(id, familyId);
  }

  // ──────────────────────────────────────────────────────────
  // 删除(软删除) + 恢复
  // ──────────────────────────────────────────────────────────
  async delete(id: string, familyId: string): Promise<void> {
    const record = await findOne<BillRecord>(
      this.db,
      'SELECT * FROM bill_record WHERE id = ? AND family_id = ? AND deleted_at IS NULL',
      id,
      familyId,
    );
    if (!record) throw new BizError(ErrorCode.NOT_FOUND, '账单不存在');

    await execute(this.db, 'UPDATE bill_record SET deleted_at = ? WHERE id = ?', now(), id);
  }

  async restore(id: string, familyId: string): Promise<void> {
    const record = await findOne<BillRecord>(
      this.db,
      'SELECT * FROM bill_record WHERE id = ? AND family_id = ? AND deleted_at IS NOT NULL',
      id,
      familyId,
    );
    if (!record) throw new BizError(ErrorCode.NOT_FOUND, '账单不存在或未被删除');

    await execute(this.db, 'UPDATE bill_record SET deleted_at = NULL WHERE id = ?', id);
  }

  // ──────────────────────────────────────────────────────────
  // 统计
  // ──────────────────────────────────────────────────────────
  async stats(familyId: string, month: string): Promise<BillStats> {
    // month 格式: 'YYYY-MM'
    const like = `${month}%`;

    // 总支出
    const totalRow = await this.db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM bill_record WHERE family_id = ? AND bill_date LIKE ? AND deleted_at IS NULL'
    ).bind(familyId, like).first<{ total: number }>();
    const total = totalRow?.total ?? 0;

    // 日均
    const daysInMonth = new Date(parseInt(month.slice(0, 4)), parseInt(month.slice(5, 7)), 0).getDate();
    const dayOfMonth = Math.min(new Date().getDate(), daysInMonth);
    const dailyAvg = total / (month === new Date().toISOString().slice(0, 7) ? dayOfMonth : daysInMonth);

    // 按一级分类
    const byCategory = await this.db.prepare(
      `SELECT b.category_l1 as categoryId, COALESCE(c.name, b.category_l1) as name, COALESCE(c.icon, '📦') as icon, COALESCE(c.color, '#8C8C8C') as color, SUM(b.amount) as amount
       FROM bill_record b LEFT JOIN bill_category c ON c.id = b.category_l1
       WHERE b.family_id = ? AND b.bill_date LIKE ? AND b.deleted_at IS NULL
       GROUP BY b.category_l1 ORDER BY amount DESC`
    ).bind(familyId, like).all<{ categoryId: string; name: string; icon: string; color: string; amount: number }>();

    const categoryStats = (byCategory.results ?? []).map((r) => ({
      ...r,
      percent: total > 0 ? Math.round((r.amount / total) * 100) : 0,
    }));

    // 按成员
    const byMember = await this.db.prepare(
      `SELECT b.payer_id as memberId, m.nickname, SUM(b.amount) as amount
       FROM bill_record b JOIN sys_member m ON m.id = b.payer_id
       WHERE b.family_id = ? AND b.bill_date LIKE ? AND b.deleted_at IS NULL
       GROUP BY b.payer_id ORDER BY amount DESC`
    ).bind(familyId, like).all<{ memberId: string; nickname: string; amount: number }>();

    // 月趋势(近 6 个月)
    const trend = await this.db.prepare(
      `SELECT substr(bill_date, 1, 7) as month, SUM(amount) as amount
       FROM bill_record WHERE family_id = ? AND deleted_at IS NULL
       GROUP BY month ORDER BY month DESC LIMIT 6`
    ).bind(familyId).all<{ month: string; amount: number }>();

    // 按标签
    const byTag = await this.db.prepare(
      `SELECT t.id as tagId, t.name, SUM(b.amount) as amount
       FROM bill_record b JOIN bill_record_tag rt ON rt.record_id = b.id JOIN bill_tag t ON t.id = rt.tag_id
       WHERE b.family_id = ? AND b.bill_date LIKE ? AND b.deleted_at IS NULL
       GROUP BY t.id ORDER BY amount DESC`
    ).bind(familyId, like).all<{ tagId: string; name: string; amount: number }>();

    // 预算
    const budgets = await this.db.prepare(
      'SELECT * FROM bill_budget WHERE family_id = ? AND month = ?'
    ).bind(familyId, month).all<{ category_l1: string | null; amount: number }>();

    const budgetStats = (budgets.results ?? []).map((b) => {
      const catStat = b.category_l1 ? categoryStats.find((c) => c.categoryId === b.category_l1) : null;
      const used = catStat ? catStat.amount : total;
      return {
        categoryId: b.category_l1 ?? undefined,
        name: catStat?.name ?? '总预算',
        amount: b.amount,
        used,
        overspent: used > b.amount,
      };
    });

    return {
      total,
      dailyAvg: Math.round(dailyAvg * 100) / 100,
      byCategory: categoryStats,
      byMember: byMember.results ?? [],
      trend: (trend.results ?? []).reverse(),
      byTag: byTag.results ?? [],
      budget: budgetStats,
    };
  }

  // ──────────────────────────────────────────────────────────
  // CSV 导出
  // ──────────────────────────────────────────────────────────
  async exportCsv(familyId: string, from?: string, to?: string): Promise<string> {
    const conditions: string[] = ['b.family_id = ?', 'b.deleted_at IS NULL'];
    const params: unknown[] = [familyId];
    if (from) { conditions.push('b.bill_date >= ?'); params.push(from); }
    if (to) { conditions.push('b.bill_date <= ?'); params.push(to); }

    const rows = await findMany<BillRecord & { payer_name: string; cat1_name: string; cat2_name: string }>(
      this.db,
      `SELECT b.*, m.nickname as payer_name, c1.name as cat1_name, c2.name as cat2_name
       FROM bill_record b
       JOIN sys_member m ON m.id = b.payer_id
       LEFT JOIN bill_category c1 ON c1.id = b.category_l1
       LEFT JOIN bill_category c2 ON c2.id = b.category_l2
       WHERE ${conditions.join(' AND ')}
       ORDER BY b.bill_date DESC`,
      ...params,
    );

    const header = '日期,金额,一级分类,二级分类,付款人,备注\n';
    const csv = rows.map((r) =>
      `${(r as unknown as { bill_date: string }).bill_date},${r.amount},${r.cat1_name},${r.cat2_name},${r.payer_name},${(r.note ?? '').replace(/,/g, '，')}`
    ).join('\n');

    return header + csv;
  }
}
