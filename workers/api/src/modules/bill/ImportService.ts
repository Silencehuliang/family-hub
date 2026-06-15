/**
 * 导入服务(CSV)
 * 上传 -> 解析 -> 校验 -> 确认导入
 */
import type { BillCategory } from '@family-hub/shared';
import { findMany, batchExecute, now } from '../../db/client';
import { nanoid } from '../../utils/crypto';

interface ImportRow {
  billDate: string;
  amount: number;
  categoryL1: string;
  categoryL2: string;
  payerName: string;
  note?: string;
  errors?: string[];
}

export class ImportService {
  constructor(private db: D1Database) {}

  /** 解析 CSV 文本为行数据 */
  parseCsv(text: string): ImportRow[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const dateIdx = header.findIndex((h) => h.includes('日期') || h === 'date');
    const amountIdx = header.findIndex((h) => h.includes('金额') || h === 'amount');
    const cat1Idx = header.findIndex((h) => h.includes('一级') || h.includes('分类'));
    const cat2Idx = header.findIndex((h) => h.includes('二级'));
    const payerIdx = header.findIndex((h) => h.includes('付款') || h.includes('成员'));
    const noteIdx = header.findIndex((h) => h.includes('备注') || h === 'note');

    const rows: ImportRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      if (cols.length < 3) continue;

      const errors: string[] = [];
      const date = dateIdx >= 0 ? cols[dateIdx] : cols[0];
      const amountStr = amountIdx >= 0 ? cols[amountIdx] : cols[1];
      const amount = parseFloat(amountStr);

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push('日期格式错误');
      if (isNaN(amount) || amount <= 0) errors.push('金额必须为正数');

      rows.push({
        billDate: date,
        amount,
        categoryL1: cat1Idx >= 0 ? cols[cat1Idx] : '',
        categoryL2: cat2Idx >= 0 ? cols[cat2Idx] : '',
        payerName: payerIdx >= 0 ? cols[payerIdx] : '',
        note: noteIdx >= 0 ? cols[noteIdx] : undefined,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    return rows;
  }

  /** 校验并匹配分类和成员 */
  async validate(familyId: string, rows: ImportRow[]): Promise<{
    valid: ImportRow[];
    invalid: ImportRow[];
    total: number;
  }> {
    // 获取家庭分类和成员
    const categories = await findMany<BillCategory>(
      this.db,
      'SELECT * FROM bill_category WHERE family_id = ?',
      familyId,
    );
    const members = await findMany<{ id: string; nickname: string }>(
      this.db,
      'SELECT id, nickname FROM sys_member WHERE family_id = ?',
      familyId,
    );

    const catMap = new Map<string, BillCategory>();
    for (const c of categories) catMap.set(c.name, c);

    const memberMap = new Map<string, string>();
    for (const m of members) memberMap.set(m.nickname, m.id);

    const valid: ImportRow[] = [];
    const invalid: ImportRow[] = [];

    for (const row of rows) {
      const errors = [...(row.errors ?? [])];

      // 匹配分类
      const cat1 = catMap.get(row.categoryL1);
      if (!cat1 || cat1.level !== 1) {
        // 模糊匹配
        const fuzzy = categories.find((c) => c.level === 1 && c.name.includes(row.categoryL1));
        if (fuzzy) {
          row.categoryL1 = fuzzy.id;
        } else {
          errors.push(`一级分类"${row.categoryL1}"不存在`);
        }
      } else {
        row.categoryL1 = cat1.id;
      }

      if (row.categoryL2) {
        const cat2 = catMap.get(row.categoryL2);
        if (!cat2 || cat2.level !== 2) {
          const fuzzy = categories.find((c) => c.level === 2 && c.name.includes(row.categoryL2));
          if (fuzzy) {
            row.categoryL2 = fuzzy.id;
          } else {
            errors.push(`二级分类"${row.categoryL2}"不存在`);
          }
        } else {
          row.categoryL2 = cat2.id;
        }
      }

      // 匹配成员
      const payerId = memberMap.get(row.payerName);
      if (!payerId) {
        errors.push(`成员"${row.payerName}"不存在`);
      } else {
        (row as ImportRow & { payerId?: string }).payerId = payerId;
      }

      if (errors.length > 0) {
        row.errors = errors;
        invalid.push(row);
      } else {
        valid.push(row);
      }
    }

    return { valid, invalid, total: rows.length };
  }

  /** 确认导入(批量 INSERT + 去重) */
  async confirmImport(familyId: string, memberId: string, rows: ImportRow[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    // 批量插入(分批，每批 50 条)
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const stmts = batch.map((row) => {
        const id = nanoid();
        const ts = now();
        return {
          sql: `INSERT INTO bill_record (id, family_id, amount, category_l1, category_l2, payer_id, bill_date, note, created_by, created_at, updated_at)
                SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                WHERE NOT EXISTS (
                  SELECT 1 FROM bill_record WHERE family_id = ? AND amount = ? AND bill_date = ? AND category_l1 = ? AND deleted_at IS NULL
                )`,
          params: [
            id, familyId, row.amount, row.categoryL1, row.categoryL2,
            (row as ImportRow & { payerId?: string }).payerId ?? '', row.billDate, row.note ?? null,
            memberId, ts, ts,
            // 去重条件
            familyId, row.amount, row.billDate, row.categoryL1,
          ],
        };
      });

      try {
        const results = await batchExecute(this.db, stmts);
        for (const r of results) {
          if (r.meta?.changes && r.meta.changes > 0) success++;
          else failed++;
        }
      } catch {
        failed += batch.length;
      }
    }

    return { success, failed };
  }
}
