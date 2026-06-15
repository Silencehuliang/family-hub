/**
 * 模块注册中心
 * 新增模块只需:① 在 modules/xxx/ 实现;② 导出 Manifest;③ 在下方 import + push
 */
import type { ModuleManifest } from './types';
import { workspaceModule } from '@/modules/workspace';
import { billModule } from '@/modules/bill';
// Phase 3+ 启用:
// import { todoModule } from '@/modules/todo';
// import { shoppingModule } from '@/modules/shopping';
// import { calendarModule } from '@/modules/calendar';

/** 已注册模块(按 order 排序) */
export const modules: ModuleManifest[] = [
  workspaceModule,
  billModule,
  // todoModule,
  // shoppingModule,
  // calendarModule,
].sort((a, b) => a.order - b.order);

/** 获取所有路由(flatten) */
export function getModuleRoutes() {
  return modules.flatMap((m) => m.routes);
}

/** 获取有工作台卡片的模块 */
export function getWorkspaceModules() {
  return modules.filter((m) => m.workspaceCard);
}

/** 获取导航项 */
export function getNavItems() {
  return modules
    .filter((m) => m.navItem)
    .map((m) => ({ key: m.key, ...m.navItem!, icon: m.icon }));
}
