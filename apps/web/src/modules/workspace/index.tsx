/**
 * 工作台模块(首页)
 */
import type { ModuleManifest } from '@/registry/types';
import { WorkspacePage } from './WorkspacePage';

export const workspaceModule: ModuleManifest = {
  key: 'workspace',
  name: '工作台',
  icon: '🏠',
  order: 0,
  routes: [
    { path: '/', element: <WorkspacePage /> },
  ],
  navItem: { label: '工作台', to: '/' },
};
