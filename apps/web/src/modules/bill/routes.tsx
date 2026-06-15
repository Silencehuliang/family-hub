/**
 * 账单模块路由
 */
import type { RouteObject } from 'react-router-dom';
import { BillListPage } from './BillListPage';
import { BillEditPage } from './BillEditPage';
import { BillDetailPage } from './BillDetailPage';
import { BillStatsPage } from './BillStatsPage';
import { BillImportPage } from './BillImportPage';

export const billRoutes: RouteObject[] = [
  { path: '/bill', element: <BillListPage /> },
  { path: '/bill/new', element: <BillEditPage /> },
  { path: '/bill/:id', element: <BillDetailPage /> },
  { path: '/bill/:id/edit', element: <BillEditPage /> },
  { path: '/bill/stats', element: <BillStatsPage /> },
  { path: '/bill/import', element: <BillImportPage /> },
];
