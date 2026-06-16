/**
 * 预算服务
 * 查询/设置 + 超支检测
 */
import type { BillBudget } from '@family-hub/shared';
import { findOne, findMany, execute } from '../../db/client';
import { nanoid } from '../../utils/crypto';

export class BudgetService {
  constructor(private db: D1Database) {}

  /** 查询某月预算 */
  async list(familyId: string, month: string): Promise<BillBudget[]> {
    return findMany<BillBudget>(
      this.db,
      'SELECT * FROM bill_budget WHERE family_id = ? AND month = ?',
      familyId,
      month,
    );
  }

  /** 设置预算(UPSERT) */
  async set(familyId: string, input: { month: string; categoryL1?: string; amount: number }): Promise<void> {
    const existing = await findOne<BillBudget>(
      this.db,
      'SELECT * FROM bill_budget WHERE family_id = ? AND month = ? AND (category_l1 = ? OR (category_l1 IS NULL AND ? IS NULL))',
      familyId, input.month, input.categoryL1 ?? null, input.categoryL1 ?? null,
    );

    if (existing) {
      await execute(
        this.db,
        'UPDATE bill_budget SET amount = ? WHERE id = ?',
        input.amount, existing.id,
      );
    } else {
      const id = nanoid();
      await execute(
        this.db,
        'INSERT INTO bill_budget (id, family_id, category_l1, month, amount) VALUES (?, ?, ?, ?, ?)',
        id, familyId, input.categoryL1 ?? null, input.month, input.amount,
      );
    }
  }

  /** 检查超支(返回超支的预算列表) */
  async checkOverBudget(familyId: string, month: string): Promise<Array<{ name: string; budget: number; spent: number; overspent: number }>> {
    // D1 返回 snake_case，用原始类型接收
    const budgets = await findMany<BillBudget & { category_l1: string | null }>(
      this.db,
      'SELECT * FROM bill_budget WHERE family_id = ? AND month = ?',
      familyId,
      month,
    );
    if (budgets.length === 0) return [];

    // 一次性查询所有分类支出（按 category_l1 聚合）
    const spentByCategory = new Map<string, number>();
    const rows = await this.db.prepare(
      `SELECT COALESCE(category_l1, '__total__') as cat, SUM(amount) as spent
       FROM bill_record
       WHERE family_id = ? AND bill_date || '' LIKE ? AND deleted_at IS NULL
       GROUP BY category_l1`
    ).bind(familyId, `${month}%`).all<{ cat: string; spent: number }>();
    for (const r of rows.results ?? []) {
      spentByCategory.set(r.cat, r.spent);
    }
    const totalSpent = spentByCategory.get('__total__') ?? 0;

    // 一次性查询所有分类名称
    const catIds = [...new Set(budgets.map((b) => b.category_l1).filter(Boolean))] as string[];
    const catNames = new Map<string, string>();
    if (catIds.length > 0) {
      const placeholders = catIds.map(() => '?').join(',');
      const nameRows = await this.db.prepare(
        `SELECT id, name FROM bill_category WHERE id IN (${placeholders})`
      ).bind(...catIds).all<{ id: string; name: string }>();
      for (const r of nameRows.results ?? []) {
        catNames.set(r.id, r.name);
      }
    }

    const overspent: Array<{ name: string; budget: number; spent: number; overspent: number }> = [];
    for (const b of budgets) {
      const spent = b.category_l1 ? (spentByCategory.get(b.category_l1) ?? 0) : totalSpent;
      const name = b.category_l1 ? (catNames.get(b.category_l1) ?? '未知分类') : '总预算';

      if (spent > b.amount) {
        overspent.push({ name, budget: b.amount, spent, overspent: spent - b.amount });
      }
    }

    return overspent;
  }
}
