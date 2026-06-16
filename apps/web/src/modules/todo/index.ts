import type { ModuleManifest } from '@/registry/types';
import { todoRoutes } from './routes';
import { WorkspaceCard } from './WorkspaceCard';

export const todoModule: ModuleManifest = {
  key: 'todo',
  name: '待办',
  icon: '✅',
  order: 30,
  routes: todoRoutes,
  navItem: { label: '待办', to: '/todo' },
  workspaceCard: WorkspaceCard,
};
