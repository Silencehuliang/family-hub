/**
 * 模块注册清单接口
 * 每个业务模块导出一个 ModuleManifest,通过 registry 注册到工作台与导航
 */
import type { Role } from '@family-hub/shared';
import type { RouteObject } from 'react-router-dom';

export interface ModuleManifest {
  /** 模块唯一标识 */
  key: string;
  /** 显示名 */
  name: string;
  /** 图标(emoji 或 AntD 图标名) */
  icon: string;
  /** 导航排序(小在前) */
  order: number;
  /** 可见角色(默认全部) */
  roles?: Role[];
  /** 路由配置 */
  routes: RouteObject[];
  /** 工作台卡片组件(可选) */
  workspaceCard?: React.FC;
  /** 导航项配置(可选) */
  navItem?: { label: string; to: string };
}
