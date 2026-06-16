/**
 * 周期账单服务
 * CRUD + tick()(扫描到期 -> 生成记录 -> 推进 nextDate)
 */
import { ErrorCode } from '@family-hub/shared';
import type { BillRecurring } from '@family-hub/shared';
import { BizError } from '../../utils/response';
import { findOne, findMany, execute, now } from '../../db/client';
import { nanoid } from '../../utils/crypto';
import { camelCaseAll } from '../../utils/mapper';

export class RecurringService {
  constructor(private db: D1Database) {}

  /** 列表 */
  async list(familyId: string): Promise<BillRecurring[]> {
    const raw = await findMany<Record<string, unknown>>(
      this.db,
      'SELECT * FROM bill_recurring WHERE family_id = ? ORDER BY next_date',
      familyId,
    );
    return camelCaseAll<BillRecurring>(raw);
  }

  /** 新建 */
  async create(familyId: string, input: {
    amount: number;
    categoryL1: string;
    categoryL2: string;
    payerId: string;
    cycle: string;
    nextDate: string;
    note?: string;
  }): Promise<BillRecurring> {
    const id = nanoid();
    const ts = now();

    await execute(
      this.db,
      `INSERT INTO bill_recurring (id, family_id, amount, category_l1, category_l2, payer_id, cycle, next_date, note, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      id, familyId, input.amount, input.categoryL1, input.categoryL2, input.payerId, input.cycle, input.nextDate, input.note ?? null, ts,
    );

    return findOne<BillRecurring>(this.db, 'SELECT * FROM bill_recurring WHERE id = ?', id) as Promise<BillRecurring>;
  }

  /** 启用/停用 */
  async setActive(id: string, familyId: string, active: boolean): Promise<void> {
    const rec = await findOne<BillRecurring>(
      this.db,
      'SELECT * FROM bill_recurring WHERE id = ? AND family_id = ?',
      id,
      familyId,
    );
    if (!rec) throw new BizError(ErrorCode.NOT_FOUND, '周期账单不存在');

    await execute(this.db, 'UPDATE bill_recurring SET active = ? WHERE id = ?', active ? 1 : 0, id);
  }

  /** 删除 */
  async delete(id: string, familyId: string): Promise<void> {
    const rec = await findOne<BillRecurring>(
      this.db,
      'SELECT * FROM bill_recurring WHERE id = ? AND family_id = ?',
      id,
      familyId,
    );
    if (!rec) throw new BizError(ErrorCode.NOT_FOUND, '周期账单不存在');

    await execute(this.db, 'DELETE FROM bill_recurring WHERE id = ?', id);
  }

  /** Cron:扫描到期周期账单，生成记录并推进 nextDate */
  async tick(): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    // D1 返回 snake_case，用原始类型接收
    const due = await findMany<BillRecurring & { family_id: string; category_l1: string; category_l2: string; payer_id: string; next_date: string }>(
      this.db,
      'SELECT * FROM bill_recurring WHERE active = 1 AND next_date <= ?',
      today,
    );

    let generated = 0;
    for (const rec of due) {
      // 生成账单记录
      const billId = nanoid();
      const ts = now();
      await execute(
        this.db,
        `INSERT INTO bill_record (id, family_id, amount, category_l1, category_l2, payer_id, bill_date, note, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        billId, rec.family_id, rec.amount, rec.category_l1, rec.category_l2, rec.payer_id, rec.next_date, rec.note ?? `周期账单自动生成`, rec.payer_id, ts, ts,
      );

      // 推进 nextDate
      const nextDate = this.advanceDate(rec.next_date, rec.cycle);
      await execute(
        this.db,
        'UPDATE bill_recurring SET next_date = ? WHERE id = ?',
        nextDate, rec.id,
      );

      generated++;
    }

    return generated;
  }

  /** 根据周期计算下一个日期 */
  private advanceDate(dateStr: string, cycle: string): string {
    const d = new Date(dateStr);
    switch (cycle) {
      case 'daily': d.setDate(d.getDate() + 1); break;
      case 'weekly': d.setDate(d.getDate() + 7); break;
      case 'monthly': d.setMonth(d.getMonth() + 1); break;
      case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
    }
    return d.toISOString().slice(0, 10);
  }
}
