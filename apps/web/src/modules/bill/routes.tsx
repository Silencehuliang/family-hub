/**
 * 账单模块路由
 */
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { BillListPage } from './BillListPage';
import { BillEditPage } from './BillEditPage';
import { BillDetailPage } from './BillDetailPage';
import { BillImportPage } from './BillImportPage';
import { BudgetPage } from './BudgetPage';

const BillStatsPage = lazy(() => import('./BillStatsPage'));

export const billRoutes: RouteObject[] = [
  { path: '/bill', element: <BillListPage /> },
  { path: '/bill/new', element: <BillEditPage /> },
  { path: '/bill/:id', element: <BillDetailPage /> },
  { path: '/bill/:id/edit', element: <BillEditPage /> },
  { path: '/bill/stats', element: <BillStatsPage /> },
  { path: '/bill/import', element: <BillImportPage /> },
  { path: '/bill/budget', element: <BudgetPage /> },
];
