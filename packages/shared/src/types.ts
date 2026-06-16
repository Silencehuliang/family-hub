/**
 * 全局类型定义(前后端共享)
 */
import type {
  Role,
  TodoStatus,
  Priority,
  ShopListStatus,
  EventType,
  NotifyType,
  Cycle,
} from './enums';

/** 家庭 */
export interface Family {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
}

/** 成员 */
export interface Member {
  id: string;
  familyId: string;
  nickname: string;
  avatarUrl?: string;
  role: Role;
  createdAt: number;
}

/** 已信任设备 */
export interface Device {
  id: string;
  memberId: string;
  fingerprint: string;
  deviceName?: string;
  lastIp?: string;
  lastActiveAt: number;
  trusted: 0 | 1;
  createdAt: number;
}

/** 会话信息(/auth/me 返回) */
export interface SessionInfo {
  member: Member;
  family: Family;
  device: Device;
}

/** 账单分类 */
export type BillCategoryLevel = 1 | 2;

export interface BillCategory {
  id: string;
  familyId: string;
  level: BillCategoryLevel;
  name: string;
  parentId?: string;
  icon?: string;
  color?: string;
  sort: number;
  hidden: boolean;
}

/** 账单标签 */
export interface BillTag {
  id: string;
  familyId: string;
  name: string;
  color: string;
  archived: boolean;
}

/** 账单记录(仅支出) */
export interface BillRecord {
  id: string;
  familyId: string;
  amount: number;
  categoryL1: string;
  categoryL2: string;
  payerId: string;
  billDate: string; // YYYY-MM-DD
  note?: string;
  imageUrl?: string;
  tags?: BillTag[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

/** 待办 */
export interface TodoItem {
  id: string;
  familyId: string;
  title: string;
  note?: string;
  status: TodoStatus;
  priority: Priority;
  dueAt?: number;
  repeatRule?: string;
  assignees?: Member[];
  subtasks?: TodoSubtask[];
  createdBy: string;
  completedBy?: string;
  completedAt?: number;
  createdAt: number;
}

export interface TodoSubtask {
  id: string;
  todoId: string;
  title: string;
  done: boolean;
  sort: number;
}

/** 购物清单 */
export interface ShopList {
  id: string;
  familyId: string;
  name: string;
  status: ShopListStatus;
  createdBy: string;
  createdAt: number;
}

export interface ShopItem {
  id: string;
  listId: string;
  name: string;
  qty: number;
  unit: string;
  estPrice?: number;
  category?: string;
  priority: Priority;
  bought: 0 | 1;
  buyerId?: string;
  actualPrice?: number;
  boughtAt?: number;
  note?: string;
  sort: number;
}

/** 日程 */
export interface EventItem {
  id: string;
  familyId: string;
  title: string;
  type: EventType;
  startAt: number;
  endAt?: number;
  allDay: boolean;
  location?: string;
  note?: string;
  repeatRule?: string;
  createdBy: string;
  createdAt: number;
}

/** 周期账单 */
export interface BillRecurring {
  id: string;
  familyId: string;
  amount: number;
  categoryL1: string;
  categoryL2: string;
  payerId: string;
  cycle: Cycle;
  nextDate: string;
  note?: string;
  active: boolean;
  createdAt: number;
}

/** 预算 */
export interface BillBudget {
  id: string;
  familyId: string;
  categoryL1: string | null;
  month: string;
  amount: number;
}

/** 账单统计 */
export interface BillStats {
  total: number;
  dailyAvg: number;
  byCategory: Array<{
    categoryId: string;
    name: string;
    icon: string;
    color: string;
    amount: number;
    percent: number;
  }>;
  byMember: Array<{
    memberId: string;
    nickname: string;
    amount: number;
  }>;
  trend: Array<{
    month: string;
    amount: number;
  }>;
  byTag: Array<{
    tagId: string;
    name: string;
    amount: number;
  }>;
  budget: Array<{
    categoryId?: string;
    name?: string;
    amount: number;
    used: number;
    overspent: boolean;
  }>;
}

/** 导入任务 */
export interface BillImportJob {
  id: string;
  familyId: string;
  fileUrl: string;
  status: 'parsing' | 'validating' | 'confirming' | 'importing' | 'done' | 'failed';
  total: number;
  success: number;
  failed: number;
  errorReportUrl?: string;
  createdBy: string;
  createdAt: number;
}

/** 通知偏好(每成员每类型) */
export interface NotifyPref {
  type: NotifyType;
  feishu: boolean;
  webpush: boolean;
  inapp: boolean;
}

/** 应用内通知 */
export interface AppNotification {
  id: string;
  familyId: string;
  memberId?: string;
  type: NotifyType;
  title: string;
  body?: string;
  refType?: string;
  refId?: string;
  read: boolean;
  createdAt: number;
}

/** 工作台摘要 */
export interface WorkspaceSummary {
  monthSpending: number;
  monthBudget?: number;
  todayReminders: Array<{ type: string; title: string; refId?: string }>;
  pendingShopCount: number;
  upcomingEvents: Array<{ id: string; title: string; startAt: number; type: string }>;
}

/** 统一错误响应 */
export interface ApiError {
  error: { code: string; message: string; field?: string };
}

/** 统一成功响应 */
export interface ApiOk<T> {
  data: T;
}
