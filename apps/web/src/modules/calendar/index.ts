import type { ModuleManifest } from '@/registry/types';
import { calendarRoutes } from './routes';
import { WorkspaceCard } from './WorkspaceCard';

export const calendarModule: ModuleManifest = {
  key: 'calendar',
  name: '日程',
  icon: '📅',
  order: 50,
  routes: calendarRoutes,
  navItem: { label: '日程', to: '/calendar' },
  workspaceCard: WorkspaceCard,
};
