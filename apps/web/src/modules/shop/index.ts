import type { ModuleManifest } from '@/registry/types';
import { shopRoutes } from './routes';
import { WorkspaceCard } from './WorkspaceCard';

export const shopModule: ModuleManifest = {
  key: 'shop',
  name: '购物清单',
  icon: '🛒',
  order: 40,
  routes: shopRoutes,
  navItem: { label: '购物', to: '/shop' },
  workspaceCard: WorkspaceCard,
};
