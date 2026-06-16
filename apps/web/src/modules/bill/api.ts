/**
 * 账单模块 API hooks (React Query)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import type { BillRecord, BillCategory, BillTag, BillStats, BillRecurring } from '@family-hub/shared';
import type { CreateBillInput, UpdateBillInput, CreateBillTagInput, CreateBillCategoryInput, SetBillBudgetInput, CreateBillRecurringInput } from '@family-hub/shared';

/** 账单 + 分类名(后端 JOIN 返回) */
export type BillWithCategory = BillRecord & { tags: BillTag[]; cat1Name?: string; cat1Icon?: string; cat2Name?: string; cat2Icon?: string };

// ─── 查询 ─────────────────────────────────────────────────────

/** 账单列表 */
export function useBills(query: { from?: string; to?: string; category?: string; payer?: string; tag?: string; page?: number }) {
  return useQuery({
    queryKey: ['bills', query],
    queryFn: () => api.get<{ items: BillWithCategory[]; total: number }>('/api/bill', { query }),
  });
}

/** 账单详情 */
export function useBill(id: string) {
  return useQuery({
    queryKey: ['bill', id],
    queryFn: () => api.get<BillWithCategory>(`/api/bill/${id}`),
    enabled: !!id,
  });
}

/** 统计 */
export function useBillStats(month: string) {
  return useQuery({
    queryKey: ['billStats', month],
    queryFn: () => api.get<BillStats>('/api/bill/stats/summary', { query: { month } }),
  });
}

/** 分类树 */
export function useCategoryTree() {
  return useQuery({
    queryKey: ['categoryTree'],
    queryFn: () => api.get<{ l1: BillCategory[]; l2: BillCategory[] }>('/api/bill/category/tree'),
    staleTime: 5 * 60 * 1000, // 5 分钟
  });
}

/** 标签列表 */
export function useTags() {
  return useQuery({
    queryKey: ['billTags'],
    queryFn: () => api.get<BillTag[]>('/api/bill/tag'),
  });
}

/** 周期账单列表 */
export function useRecurrings() {
  return useQuery({
    queryKey: ['billRecurrings'],
    queryFn: () => api.get<BillRecurring[]>('/api/bill/recurring'),
  });
}

/** 预算列表 */
export function useBudgets(month: string) {
  return useQuery({
    queryKey: ['billBudgets', month],
    queryFn: () => api.get<Array<{ id: string; category_l1: string | null; month: string; amount: number }>>('/api/bill/budget', { query: { month } }),
  });
}

// ─── 写入 ─────────────────────────────────────────────────────

/** 创建账单 */
export function useCreateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBillInput) => api.post<BillRecord>('/api/bill', input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills'] }); qc.invalidateQueries({ queryKey: ['billStats'] }); },
  });
}

/** 修改账单 */
export function useUpdateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateBillInput & { id: string }) => api.put<BillRecord>(`/api/bill/${id}`, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills'] }); qc.invalidateQueries({ queryKey: ['billStats'] }); },
  });
}

/** 删除账单 */
export function useDeleteBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/bill/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills'] }); qc.invalidateQueries({ queryKey: ['billStats'] }); },
  });
}

/** 创建标签 */
export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBillTagInput) => api.post<BillTag>('/api/bill/tag', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billTags'] }),
  });
}

/** 创建二级分类 */
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBillCategoryInput) => api.post<BillCategory>('/api/bill/category', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categoryTree'] }),
  });
}

/** 设置预算 */
export function useSetBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SetBillBudgetInput) => api.post('/api/bill/budget', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billBudgets'] }),
  });
}

/** 创建周期账单 */
export function useCreateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBillRecurringInput) => api.post<BillRecurring>('/api/bill/recurring', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billRecurrings'] }),
  });
}

interface ImportCsvRow {
  billDate: string;
  amount: number;
  categoryL1: string;
  categoryL2: string;
  payerName: string;
  note?: string;
  errors?: string[];
}

/** 导入 CSV */
export function useImportCsv() {
  return useMutation({
    mutationFn: (csvText: string) =>
      api.post<{ total: number; validCount: number; invalidCount: number; valid: ImportCsvRow[]; invalid: ImportCsvRow[] }>(
        '/api/bill/import', csvText, { plainText: true },
      ),
  });
}

/** 确认导入 */
export function useConfirmImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { rows: unknown[]; skipFailed: boolean }) => api.post('/api/bill/import/confirm', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bills'] }),
  });
}
