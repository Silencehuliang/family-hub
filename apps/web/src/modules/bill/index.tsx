/**
 * 账单模块
 */
import type { ModuleManifest } from '@/registry/types';
import { billRoutes } from './routes';
import { WorkspaceCard } from './WorkspaceCard';

export const billModule: ModuleManifest = {
  key: 'bill',
  name: '账单',
  icon: '📒',
  order: 20,
  routes: billRoutes,
  navItem: { label: '账单', to: '/bill' },
  workspaceCard: WorkspaceCard,
};
