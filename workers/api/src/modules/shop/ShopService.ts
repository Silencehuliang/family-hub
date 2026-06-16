import { ErrorCode } from '@family-hub/shared';
import type { ShopList, ShopItem } from '@family-hub/shared';
import { BizError } from '../../utils/response';
import { findOne, findMany, execute, now } from '../../db/client';
import { nanoid } from '../../utils/crypto';
import { camelCase, camelCaseAll } from '../../utils/mapper';
import { BillService } from '../bill/BillService';

export class ShopService {
  constructor(
    private db: D1Database,
    private billServiceFactory: (db: D1Database) => BillService = (d) => new BillService(d),
  ) {}

  async listLists(familyId: string): Promise<(ShopList & { itemCount: number; boughtCount: number })[]> {
    const rows = await findMany<Record<string, unknown>>(
      this.db,
      `SELECT sl.*,
        (SELECT COUNT(*) FROM shop_item WHERE list_id = sl.id) as item_count,
        (SELECT COUNT(*) FROM shop_item WHERE list_id = sl.id AND bought = 1) as bought_count
       FROM shop_list sl WHERE sl.family_id = ? ORDER BY sl.created_at DESC`,
      familyId,
    );
    return rows.map((r) => camelCase<ShopList & { itemCount: number; boughtCount: number }>(r));
  }

  async createList(familyId: string, memberId: string, input: { name: string }): Promise<ShopList> {
    const id = nanoid();
    const ts = now();
    await execute(
      this.db,
      'INSERT INTO shop_list (id, family_id, name, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      id, familyId, input.name, 'active', memberId, ts,
    );
    const raw = await findOne<Record<string, unknown>>(this.db, 'SELECT * FROM shop_list WHERE id = ?', id);
    return camelCase<ShopList>(raw!);
  }

  async listItems(listId: string, familyId: string, bought?: string): Promise<ShopItem[]> {
    const list = await findOne<Record<string, unknown>>(this.db, 'SELECT * FROM shop_list WHERE id = ? AND family_id = ?', listId, familyId);
    if (!list) throw new BizError(ErrorCode.NOT_FOUND, '购物清单不存在');

    let sql = 'SELECT * FROM shop_item WHERE list_id = ?';
    const params: unknown[] = [listId];
    if (bought === '0' || bought === '1') {
      sql += ' AND bought = ?';
      params.push(parseInt(bought));
    }
    sql += ' ORDER BY sort';
    const rows = await findMany<Record<string, unknown>>(this.db, sql, ...params);
    return camelCaseAll<ShopItem>(rows);
  }

  async addItem(listId: string, familyId: string, input: {
    name: string; qty?: number; unit?: string; estPrice?: number; category?: string; priority?: string; note?: string;
  }): Promise<ShopItem> {
    const list = await findOne<Record<string, unknown>>(this.db, 'SELECT * FROM shop_list WHERE id = ? AND family_id = ?', listId, familyId);
    if (!list) throw new BizError(ErrorCode.NOT_FOUND, '购物清单不存在');

    const id = nanoid();
    const maxSort = await this.db.prepare('SELECT COALESCE(MAX(sort), 0) as max_sort FROM shop_item WHERE list_id = ?').bind(listId).first<{ max_sort: number }>();
    const sort = (maxSort?.max_sort ?? 0) + 1;

    await execute(
      this.db,
      'INSERT INTO shop_item (id, list_id, name, qty, unit, est_price, category, priority, sort, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id, listId, input.name, input.qty ?? 1, input.unit ?? '个', input.estPrice ?? null, input.category ?? null, input.priority ?? 'mid', sort, input.note ?? null,
    );
    const raw = await findOne<Record<string, unknown>>(this.db, 'SELECT * FROM shop_item WHERE id = ?', id);
    return camelCase<ShopItem>(raw!);
  }

  async updateItem(itemId: string, listId: string, familyId: string, input: {
    name?: string; qty?: number; unit?: string; estPrice?: number; category?: string; priority?: string; note?: string;
  }): Promise<ShopItem> {
    const list = await findOne<Record<string, unknown>>(this.db, 'SELECT * FROM shop_list WHERE id = ? AND family_id = ?', listId, familyId);
    if (!list) throw new BizError(ErrorCode.NOT_FOUND, '购物清单不存在');

    const item = await findOne<Record<string, unknown>>(this.db, 'SELECT * FROM shop_item WHERE id = ? AND list_id = ?', itemId, listId);
    if (!item) throw new BizError(ErrorCode.NOT_FOUND, '商品不存在');

    const sets: string[] = [];
    const params: unknown[] = [];
    if (input.name !== undefined) { sets.push('name = ?'); params.push(input.name); }
    if (input.qty !== undefined) { sets.push('qty = ?'); params.push(input.qty); }
    if (input.unit !== undefined) { sets.push('unit = ?'); params.push(input.unit); }
    if (input.estPrice !== undefined) { sets.push('est_price = ?'); params.push(input.estPrice); }
    if (input.category !== undefined) { sets.push('category = ?'); params.push(input.category); }
    if (input.priority !== undefined) { sets.push('priority = ?'); params.push(input.priority); }
    if (input.note !== undefined) { sets.push('note = ?'); params.push(input.note); }

    if (sets.length === 0) return camelCase<ShopItem>(item);

    params.push(itemId);
    await execute(this.db, `UPDATE shop_item SET ${sets.join(', ')} WHERE id = ?`, ...params);
    const raw = await findOne<Record<string, unknown>>(this.db, 'SELECT * FROM shop_item WHERE id = ?', itemId);
    return camelCase<ShopItem>(raw!);
  }

  async deleteItem(itemId: string, listId: string, familyId: string): Promise<void> {
    const list = await findOne<Record<string, unknown>>(this.db, 'SELECT * FROM shop_list WHERE id = ? AND family_id = ?', listId, familyId);
    if (!list) throw new BizError(ErrorCode.NOT_FOUND, '购物清单不存在');

    const item = await findOne<Record<string, unknown>>(this.db, 'SELECT * FROM shop_item WHERE id = ? AND list_id = ?', itemId, listId);
    if (!item) throw new BizError(ErrorCode.NOT_FOUND, '商品不存在');

    await execute(this.db, 'DELETE FROM shop_item WHERE id = ?', itemId);
  }

  async deleteList(listId: string, familyId: string): Promise<void> {
    const list = await findOne<Record<string, unknown>>(this.db, 'SELECT * FROM shop_list WHERE id = ? AND family_id = ?', listId, familyId);
    if (!list) throw new BizError(ErrorCode.NOT_FOUND, '购物清单不存在');

    await this.db.batch([
      this.db.prepare('DELETE FROM shop_item WHERE list_id = ?').bind(listId),
      this.db.prepare('DELETE FROM shop_list WHERE id = ?').bind(listId),
    ]);
  }

  async buyItem(itemId: string, listId: string, familyId: string, input: { actualPrice: number; buyerId: string }): Promise<ShopItem> {
    const list = await findOne<Record<string, unknown>>(this.db, 'SELECT * FROM shop_list WHERE id = ? AND family_id = ?', listId, familyId);
    if (!list) throw new BizError(ErrorCode.NOT_FOUND, '购物清单不存在');

    const item = await findOne<Record<string, unknown>>(this.db, 'SELECT * FROM shop_item WHERE id = ? AND list_id = ?', itemId, listId);
    if (!item) throw new BizError(ErrorCode.NOT_FOUND, '商品不存在');

    await execute(
      this.db,
      'UPDATE shop_item SET bought = 1, actual_price = ?, buyer_id = ?, bought_at = ? WHERE id = ?',
      input.actualPrice, input.buyerId, now(), itemId,
    );
    const raw = await findOne<Record<string, unknown>>(this.db, 'SELECT * FROM shop_item WHERE id = ?', itemId);
    return camelCase<ShopItem>(raw!);
  }

  async listToBill(listId: string, familyId: string, memberId: string, input: { categoryL1?: string; categoryL2?: string; payerId: string }): Promise<unknown> {
    const list = await findOne<Record<string, unknown>>(this.db, 'SELECT * FROM shop_list WHERE id = ? AND family_id = ?', listId, familyId);
    if (!list) throw new BizError(ErrorCode.NOT_FOUND, '购物清单不存在');

    const boughtItems = await findMany<Record<string, unknown>>(
      this.db,
      'SELECT * FROM shop_item WHERE list_id = ? AND bought = 1',
      listId,
    );
    if (boughtItems.length === 0) throw new BizError(ErrorCode.VALIDATION, '没有已购买的商品');

    const total = boughtItems.reduce((sum, item) => sum + (item.actual_price as number || 0), 0);
    const billSvc = this.billServiceFactory(this.db);
    const bill = await billSvc.create(familyId, memberId, {
      amount: total,
      categoryL1: input.categoryL1 ?? 'cat_daily',
      categoryL2: input.categoryL2 ?? 'cat_daily_paper',
      payerId: input.payerId,
      billDate: new Date().toISOString().slice(0, 10),
      note: `购物清单: ${list.name}`,
    });

    await execute(this.db, 'UPDATE shop_list SET status = ? WHERE id = ?', 'done', listId);
    return bill;
  }
}
