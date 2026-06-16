/**
 * Service 工厂
 * 统一管理 Service 实例化，避免路由层直接 new
 */
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { BillService } from '../modules/bill/BillService';
import { CategoryService } from '../modules/bill/CategoryService';
import { TagService } from '../modules/bill/TagService';
import { ImportService } from '../modules/bill/ImportService';
import { RecurringService } from '../modules/bill/RecurringService';
import { BudgetService } from '../modules/bill/BudgetService';
import { AuthService } from '../modules/auth/AuthService';

export function createBillService(db: D1Database): BillService {
  return new BillService(db);
}

export function createCategoryService(db: D1Database): CategoryService {
  return new CategoryService(db);
}

export function createTagService(db: D1Database): TagService {
  return new TagService(db);
}

export function createImportService(db: D1Database): ImportService {
  return new ImportService(db);
}

export function createRecurringService(db: D1Database): RecurringService {
  return new RecurringService(db);
}

export function createBudgetService(db: D1Database): BudgetService {
  return new BudgetService(db);
}

export function createAuthService(db: D1Database, kv: KVNamespace): AuthService {
  return new AuthService(db, kv);
}
