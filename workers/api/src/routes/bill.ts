/**
 * 账单路由
 * CRUD + 统计 + 导出 + 导入 + 分类 + 标签 + 周期 + 预算
 */
import { Hono } from 'hono';
import {
  createBillSchema, updateBillSchema, createBillTagSchema,
  createBillCategorySchema, setBillBudgetSchema, createBillRecurringSchema,
} from '@family-hub/shared';
import { BillService } from '../modules/bill/BillService';
import { CategoryService } from '../modules/bill/CategoryService';
import { TagService } from '../modules/bill/TagService';
import { ImportService } from '../modules/bill/ImportService';
import { RecurringService } from '../modules/bill/RecurringService';
import { BudgetService } from '../modules/bill/BudgetService';
import { ok } from '../utils/response';
import type { Env, HonoVars } from '../env';

export const billRoutes = new Hono<{ Bindings: Env; Variables: HonoVars }>();

// ═══════════════════════════════════════════════════════════════
// 账单 CRUD
// ═══════════════════════════════════════════════════════════════

// 列表
billRoutes.get('/', async (c) => {
  const { familyId } = c.var.auth;
  const svc = new BillService(c.env.DB);
  const query = {
    from: c.req.query('from'),
    to: c.req.query('to'),
    categoryL1: c.req.query('category'),
    payerId: c.req.query('payer'),
    tagId: c.req.query('tag'),
    page: c.req.query('page') ? parseInt(c.req.query('page')!) : undefined,
    pageSize: c.req.query('pageSize') ? parseInt(c.req.query('pageSize')!) : undefined,
  };
  const result = await svc.list(familyId, query);
  return ok(c, result);
});

// 详情
billRoutes.get('/:id', async (c) => {
  const { familyId } = c.var.auth;
  const svc = new BillService(c.env.DB);
  const record = await svc.getById(c.req.param('id'), familyId);
  return ok(c, record);
});

// 创建
billRoutes.post('/', async (c) => {
  const { familyId, memberId } = c.var.auth;
  const body = await c.req.json();
  const input = createBillSchema.parse(body);
  const svc = new BillService(c.env.DB);
  const record = await svc.create(familyId, memberId, input);
  return c.json({ data: record }, 201);
});

// 修改
billRoutes.put('/:id', async (c) => {
  const { familyId } = c.var.auth;
  const body = await c.req.json();
  const input = updateBillSchema.parse(body);
  const svc = new BillService(c.env.DB);
  const record = await svc.update(c.req.param('id'), familyId, input);
  return ok(c, record);
});

// 删除(软删除)
billRoutes.delete('/:id', async (c) => {
  const { familyId } = c.var.auth;
  const svc = new BillService(c.env.DB);
  await svc.delete(c.req.param('id'), familyId);
  return ok(c, { success: true });
});

// 恢复
billRoutes.post('/:id/restore', async (c) => {
  const { familyId } = c.var.auth;
  const svc = new BillService(c.env.DB);
  await svc.restore(c.req.param('id'), familyId);
  return ok(c, { success: true });
});

// ═══════════════════════════════════════════════════════════════
// 统计
// ═══════════════════════════════════════════════════════════════

billRoutes.get('/stats/summary', async (c) => {
  const { familyId } = c.var.auth;
  const month = c.req.query('month') ?? new Date().toISOString().slice(0, 7);
  const svc = new BillService(c.env.DB);
  const stats = await svc.stats(familyId, month);
  return ok(c, stats);
});

// ═══════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════

billRoutes.get('/export/csv', async (c) => {
  const { familyId } = c.var.auth;
  const from = c.req.query('from');
  const to = c.req.query('to');
  const svc = new BillService(c.env.DB);
  const csv = await svc.exportCsv(familyId, from, to);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=bills_${new Date().toISOString().slice(0, 10)}.csv`,
    },
  });
});

// ═══════════════════════════════════════════════════════════════
// 导入
// ═══════════════════════════════════════════════════════════════

// 上传 CSV 并解析
billRoutes.post('/import', async (c) => {
  const { familyId } = c.var.auth;
  const body = await c.req.text(); // CSV 文本直接作为 body

  const svc = new ImportService(c.env.DB);
  const rows = svc.parseCsv(body);
  if (rows.length === 0) {
    return c.json({ error: { code: 'VALIDATION', message: 'CSV 无有效数据' } }, 422);
  }

  const { valid, invalid, total } = await svc.validate(familyId, rows);

  return ok(c, {
    total,
    validCount: valid.length,
    invalidCount: invalid.length,
    valid,
    invalid,
  });
});

// 确认导入
billRoutes.post('/import/confirm', async (c) => {
  const { familyId, memberId } = c.var.auth;
  const body = await c.req.json();
  const { rows } = body as { rows: Array<{ billDate: string; amount: number; categoryL1: string; categoryL2: string; payerName: string; note?: string }>; skipFailed: boolean };

  if (!rows || rows.length === 0) {
    return c.json({ error: { code: 'VALIDATION', message: '无数据可导入' } }, 422);
  }

  const svc = new ImportService(c.env.DB);
  const result = await svc.confirmImport(familyId, memberId, rows);
  return ok(c, result);
});

// ═══════════════════════════════════════════════════════════════
// 分类
// ═══════════════════════════════════════════════════════════════

billRoutes.get('/category/tree', async (c) => {
  const { familyId } = c.var.auth;
  const svc = new CategoryService(c.env.DB);
  const tree = await svc.getTree(familyId);
  return ok(c, tree);
});

billRoutes.post('/category', async (c) => {
  const { familyId } = c.var.auth;
  const body = await c.req.json();
  const input = createBillCategorySchema.parse(body);
  const svc = new CategoryService(c.env.DB);
  const cat = await svc.create(familyId, input);
  return c.json({ data: cat }, 201);
});

billRoutes.put('/category/:id', async (c) => {
  const { familyId } = c.var.auth;
  const body = await c.req.json();
  const svc = new CategoryService(c.env.DB);
  await svc.update(c.req.param('id'), familyId, body);
  return ok(c, { success: true });
});

billRoutes.post('/category/:id/hide', async (c) => {
  const { familyId } = c.var.auth;
  const svc = new CategoryService(c.env.DB);
  await svc.setHidden(c.req.param('id'), familyId, true);
  return ok(c, { success: true });
});

billRoutes.post('/category/:id/show', async (c) => {
  const { familyId } = c.var.auth;
  const svc = new CategoryService(c.env.DB);
  await svc.setHidden(c.req.param('id'), familyId, false);
  return ok(c, { success: true });
});

// ═══════════════════════════════════════════════════════════════
// 标签
// ═══════════════════════════════════════════════════════════════

billRoutes.get('/tag', async (c) => {
  const { familyId } = c.var.auth;
  const svc = new TagService(c.env.DB);
  const tags = await svc.list(familyId);
  return ok(c, tags);
});

billRoutes.post('/tag', async (c) => {
  const { familyId } = c.var.auth;
  const body = await c.req.json();
  const input = createBillTagSchema.parse(body);
  const svc = new TagService(c.env.DB);
  const tag = await svc.create(familyId, input);
  return c.json({ data: tag }, 201);
});

billRoutes.post('/tag/:id/archive', async (c) => {
  const { familyId } = c.var.auth;
  const svc = new TagService(c.env.DB);
  await svc.archive(c.req.param('id'), familyId);
  return ok(c, { success: true });
});

// ═══════════════════════════════════════════════════════════════
// 周期账单
// ═══════════════════════════════════════════════════════════════

billRoutes.get('/recurring', async (c) => {
  const { familyId } = c.var.auth;
  const svc = new RecurringService(c.env.DB);
  const list = await svc.list(familyId);
  return ok(c, list);
});

billRoutes.post('/recurring', async (c) => {
  const { familyId } = c.var.auth;
  const body = await c.req.json();
  const input = createBillRecurringSchema.parse(body);
  const svc = new RecurringService(c.env.DB);
  const rec = await svc.create(familyId, input);
  return c.json({ data: rec }, 201);
});

billRoutes.post('/recurring/:id/toggle', async (c) => {
  const { familyId } = c.var.auth;
  const body = await c.req.json() as { active: boolean };
  const svc = new RecurringService(c.env.DB);
  await svc.setActive(c.req.param('id'), familyId, body.active);
  return ok(c, { success: true });
});

billRoutes.delete('/recurring/:id', async (c) => {
  const { familyId } = c.var.auth;
  const svc = new RecurringService(c.env.DB);
  await svc.delete(c.req.param('id'), familyId);
  return ok(c, { success: true });
});

// ═══════════════════════════════════════════════════════════════
// 预算
// ═══════════════════════════════════════════════════════════════

billRoutes.get('/budget', async (c) => {
  const { familyId } = c.var.auth;
  const month = c.req.query('month') ?? new Date().toISOString().slice(0, 7);
  const svc = new BudgetService(c.env.DB);
  const budgets = await svc.list(familyId, month);
  return ok(c, budgets);
});

billRoutes.post('/budget', async (c) => {
  const { familyId } = c.var.auth;
  const body = await c.req.json();
  const input = setBillBudgetSchema.parse(body);
  const svc = new BudgetService(c.env.DB);
  await svc.set(familyId, input);
  return ok(c, { success: true });
});
