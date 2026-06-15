# 家庭管家 PRD（产品需求规格说明）

> 版本：v1.1 ｜ 更新日期：2026-06-15
> 定位：一个 PWA 家庭管理工具集，可组合扩展，部署于 Cloudflare。
> 当前范围：单家庭自用。
>
> v1.1 变更：
> - 认证升级为「设备认证 + PIN」双因子
> - 通知系统接入飞书群机器人（主通道），Web Push 作为补充
> - 部署改为 GitHub 推送触发 Cloudflare CI/CD
> - 移除「隐私账单」功能（所有账单家庭成员共享）
> - 账单简化为「仅记录支出」，无收入
> - 账单新增一二级分类体系（含图标）、导入、标签功能

---

## 0. 决策基线

| 维度 | 决策 | 说明 |
|------|------|------|
| 使用范围 | 单家庭自用 | 不做多租户隔离，但数据表预留 `family_id` 字段便于未来扩展 |
| 认证 | **设备认证 + PIN（双因子）** | 首次用邀请码绑定设备并设 PIN；之后该设备仅凭 PIN 登录；管理员可查看/吊销设备 |
| 前端 | React + Vite | UI 库：Ant Design（PC）+ Ant Design Mobile（移动端按需） |
| 后端 | Cloudflare Workers | 边缘计算，处理 API 逻辑（采用 Hono 框架） |
| 数据库 | Cloudflare D1 | SQLite，存储关系数据 |
| 对象存储 | Cloudflare R2 | 存小票图片、头像、导入文件 |
| 缓存/会话 | Cloudflare KV | 会话 token、邀请码、设备指纹、配置缓存 |
| 通知 | **飞书群机器人（主）+ Web Push（辅）** | 飞书自定义机器人 webhook 推送到家庭群；Web Push 作为应用内补充 |
| 部署 | **GitHub → Cloudflare 自动 CI/CD** | 推送到 main 分支自动构建部署 Pages + Workers |

---

## 1. 角色与权限

### 1.1 角色

| 角色 | 说明 | 权限 |
|------|------|------|
| **管理员** | 创建家庭的用户（首个） | 全部操作 + 成员管理 + 设备管理 + 飞书配置 + 系统设置 |
| **成员** | 通过邀请码加入的家人 | 读全部家庭数据 + 增删改自己的数据 |

### 1.2 权限矩阵（节选）

| 操作 | 管理员 | 成员 |
|------|:------:|:----:|
| 邀请/移除成员 | ✅ | ❌ |
| 查看/吊销任意设备 | ✅ | 仅本人设备 |
| 飞书通知配置 | ✅ | ❌ |
| 创建账单/日程/清单 | ✅ | ✅ |
| 修改他人数据 | ✅ | ❌（仅本人） |
| 删除数据 | ✅ | 仅本人 |
| 系统设置 | ✅ | ❌ |

> 说明：所有账单家庭成员均可见，无隐私账单概念。

---

## 2. 认证流程（设备 + PIN 双因子）

### 2.1 首次绑定（设备信任）
1. 管理员在「成员管理」生成邀请码（6 位，有效期可设，默认 24h，可设使用次数）
2. 新成员打开应用 → 输入邀请码 → 设置个人 PIN（4~6 位数字）
3. 系统采集设备指纹（User-Agent + 屏幕分辨率 + 时区 + 随机 deviceId 的哈希），标记为**已信任设备**
4. 绑定成功，自动登录并下发会话 token

### 2.2 日常登录
- **已信任设备**：仅需输入 PIN → 校验「设备指纹 + PIN」→ 签发会话
- **未信任设备**：拒绝并提示「请联系管理员邀请加入」
- **PIN 错误限流**：5 次 / 10min，超限锁定 30min
- **设备指纹变化**：提示重新信任（管理员授权）

### 2.3 设备管理
- 管理员可见所有成员的已信任设备（设备名、最后活跃时间、IP 归属）
- 可吊销设备（成员换机 / 遗失时）
- 成员可查看并管理自己的设备

### 2.4 安全措施
- PIN 经 bcrypt 哈希存储
- 设备指纹 + member_id 作为设备唯一性约束
- 会话 token 存 KV，TTL 30 天，支持主动登出

---

## 3. 核心模块

### 3.1 家庭账单（账本）

**目标**：记录家庭**支出**（仅支出，无收入），提供多维度分析。

#### 3.1.1 记账字段
| 字段 | 说明 |
|------|------|
| 金额 | 必填，支持小数 2 位 |
| 一级分类 | 必填，见 3.1.6 分类体系 |
| 二级分类 | 必填 |
| 付款人 | 必填，默认当前成员，可选其他成员 |
| 日期 | 必填，默认今天，支持补录历史 |
| 标签 | 多选，自定义（如"周末聚餐""装修"），用于跨分类聚合 |
| 备注 | 可选 |
| 小票图片 | 可选，上传 R2 |

> 支持快速记账：首页快捷入口，3 步内完成（金额 → 分类 → 保存）。

#### 3.1.2 周期性账单
- 适用于房租、水电、订阅服务（流媒体 / 云盘）等固定支出
- 配置周期（月 / 周 / 年）+ 自动生成日期
- 到期前通过飞书 + Web Push 提醒

#### 3.1.3 标签功能
- 一笔账单可打多个标签
- 标签可创建、合并、归档
- 分析中可按标签聚合（如"装修花了多少"）

#### 3.1.4 导入功能
- 支持格式：**CSV / Excel（.xlsx）**
- 提供标准模板下载（含字段说明 + 分类映射示例）
- 导入流程：上传 → 字段映射预览 → 分类自动匹配 + 手动修正 → 去重校验 → 确认导入
- 异常行单独列出，支持下载错误报告修正后重导

#### 3.1.5 分析与可视化
- **总览**：本月支出、日均、预算进度条
- **趋势**：近 6 / 12 个月支出折线图
- **结构**：一级分类占比饼图、Top 5 支出项
- **对比**：成员支出对比柱状图
- **标签视图**：按标签聚合的支出排行
- **预算**：按分类设月度预算，超支红色高亮 + 飞书推送

#### 3.1.6 一二级分类体系（含图标）

> 图标使用 Ant Design 图标库 + 自定义 emoji 双重方案：移动端偏 emoji，PC 端偏 Ant Design 图标。

| 一级分类 | 图标 | 二级分类示例 |
|----------|:----:|--------------|
| 🍚 餐饮 | `🥢` | 三餐、外卖、零食饮料、聚餐、果蔬生鲜 |
| 🛒 日常用品 | `🧻` | 纸品清洁、洗护日化、厨房用品、宠物用品 |
| 💡 居家水电 | `💡` | 水费、电费、燃气、宽带、物业 |
| 👕 服饰美容 | `👗` | 服装鞋帽、配饰、护肤化妆、理发美容 |
| 🏥 医疗健康 | `💊` | 门诊、药品、体检、齿科、保健 |
| 🚗 交通出行 | `🚕` | 公交地铁、打车、加油、停车过路、火车机票 |
| 📚 教育学习 | `📖` | 学费、培训、书籍、文具、兴趣班 |
| 🎮 娱乐休闲 | `🎬` | 电影演出、游戏、旅行、爱好、聚会 |
| 📱 数码电器 | `💻` | 手机、电脑、家电、配件、维修 |
| 🏠 居住房租 | `🏠` | 房租、房贷、家具 |
| 👶 家庭育儿 | `🍼` | 奶粉尿不湿、童装玩具、教育、疫苗 |
| 🎁 人情社交 | `💝` | 礼金红包、请客、礼物 |
| 💼 金融保险 | `💳` | 保险、理财、信用卡年费 |
| ✈️ 其他支出 | `📝` | 杂项（可继续细分） |

- 一级分类固定（14 项），二级分类预置 + 支持家庭自定义新增
- 每个分类可自定义图标和颜色
- 支持分类合并、隐藏、排序

---

### 3.2 家庭提醒事项（待办）

**目标**：协作完成家庭事务。

- 字段：标题、负责人（可多人）、截止时间、优先级（高 / 中 / 低）、标签、备注、子任务、状态
- 状态：待办 → 进行中 → 已完成
- **重复规则**：每天 / 每周 / 每月 / 自定义（如"每周一三五"）
- **提醒**：截止前可设提前提醒（当天、提前 1 天），飞书 + Web Push
- **视图**：按负责人分组、按截止时间排序、看板视图（待办 / 进行中 / 已完成）
- **完成记录**：谁在什么时候完成的

---

### 3.3 家庭购买清单

**目标**：协作采购，避免重复购买或漏买。

#### 3.3.1 清单管理
- 字段：商品名称、数量、单位、预估价格、分类、备注、优先级
- 分类：生鲜、日用品、零食、母婴、五金、其他（可自定义）
- 多清单：可创建多个清单（"周末采购""装修材料""年货"）

#### 3.3.2 购买流程
- 状态：待买 → 已买
- 勾选"已买"时填写：实际价格、购买人、购买时间
- **联动账单**：购买完成后可一键生成一笔账单（自动带"购物"标签 + 对应分类）
- 购物时多人实时同步（SSE / 轮询）

#### 3.3.3 模板
- 常用清单保存为模板（如"每周固定采购"）
- 一键基于模板创建新清单

---

### 3.4 重要日程提醒

**目标**：家庭重要节点不遗忘。

#### 3.4.1 日程字段
- 标题、类型、参与成员、日期 / 时间、全天 / 时间段、地点、备注、重复规则、提前提醒
- 类型：生日、纪念日、体检、缴费、出行、证件到期、其他
- **生日 / 纪念日**：录入后每年自动循环提醒

#### 3.4.2 视图
- 月历视图（默认）、周视图、日视图、列表视图
- 不同类型不同颜色标识

#### 3.4.3 提醒策略
- 提前提醒：当天 9:00、提前 1 / 3 / 7 天（可多选）
- 飞书群机器人推送 + Web Push

---

## 4. 跨模块通用能力

### 4.1 工作台（首页）
- 卡片式聚合各模块入口 + 待办摘要
- 今日提醒、本月支出概览、待买清单数量、近期日程
- 模块以「卡片」形式注册，便于后续新增功能挂载

### 4.2 成员管理
- 成员列表：头像、昵称、角色、生日
- 邀请流程：管理员生成邀请码 → 成员输入码加入 → 设 PIN → 设备信任
- 成员退出 / 移除

### 4.3 设备管理
- 设备列表：成员、设备名、最后活跃、IP 归属、信任状态
- 吊销设备、查看登录历史

### 4.4 通知中心
- **飞书群机器人（主通道）**：管理员配置家庭群 webhook，所有提醒统一推送
  - 支持飞书交互卡片（V2 升级为飞书应用后可支持"标记完成"按钮）
  - 可按通知类型开关（账单超支、待办到期、日程提醒、清单更新、周期账单）
- **Web Push（辅助通道）**：浏览器 / PWA 内推送，应用内通知列表（已读 / 未读）
- 通知偏好：每个成员可独立选择「飞书 / Web Push / 都发 / 不发」

### 4.5 设置
- 个人信息（昵称、头像、PIN 修改）
- 设备管理
- 通知偏好
- 飞书通知配置（管理员）
- 主题（浅色 / 深色 / 跟随系统）
- 数据备份与导出
- 关于与帮助

---

## 5. 非功能性需求

| 项 | 要求 |
|----|------|
| **PWA** | 可安装、离线可读（缓存已加载数据）、离线写入排队、联网自动同步 |
| **响应式** | 移动端优先（主场景），PC 端可用，断点 768px |
| **性能** | 首屏 < 2s（CDN 加速），交互响应 < 200ms |
| **数据安全** | HTTPS 全程、PIN bcrypt 哈希、飞书 webhook 加密存储、定期备份 |
| **可用性** | Cloudflare 99.9%+；离线模式不阻断核心查看 |
| **CI/CD** | GitHub 推送 main 自动构建部署；PR 触发预览环境（Cloudflare Preview Deployment） |
| **国际化** | V1 仅中文，代码层预留 i18n 接口 |
| **无障碍** | 关键操作支持键盘、对比度满足 WCAG AA |

---

## 6. 数据模型（D1 表设计概要）

> 表名前缀：`bill_` / `todo_` / `shop_` / `event_` / `sys_`

### 6.1 系统公共表
```sql
-- 家庭
sys_family(id, name, created_by, created_at)
-- 成员
sys_member(id, family_id, nickname, avatar_url, role, pin_hash, created_at)
-- 邀请码
sys_invite(code, family_id, expires_at, max_uses, used_count, created_at)
-- 设备（信任）
sys_device(id, member_id, fingerprint, device_name, last_ip, last_active_at, trusted, created_at)
-- 会话
sys_session(token, member_id, device_id, expires_at, created_at)  -- 也可放 KV
-- 通知
sys_notification(id, member_id, type, title, body, ref_type, ref_id, read, created_at)
-- 推送订阅
sys_push_subscription(id, member_id, endpoint, p256dh, auth, created_at)
-- 飞书配置（每家庭一条）
sys_feishu_config(family_id, webhook_url, secret, enabled, created_at)
-- 通知偏好（每成员）
sys_notify_pref(member_id, type, feishu, webpush, email)
```

### 6.2 账单
```sql
bill_record(id, family_id, amount, category_l1, category_l2,
            payer_id, bill_date, note, image_url, created_by, created_at)
bill_category(id, family_id, level, name, parent_id, icon, color, sort)
bill_tag(id, family_id, name, color)
bill_record_tag(record_id, tag_id)
bill_recurring(id, family_id, amount, category_l1, category_l2, payer_id, cycle, next_date, note, active)
bill_budget(id, family_id, category_l1, month, amount)
bill_import_job(id, family_id, file_url, status, total, success, failed, error_report_url, created_at)
```

### 6.3 待办
```sql
todo_item(id, family_id, title, note, status, priority, due_at, repeat_rule, created_by, created_at)
todo_assignee(todo_id, member_id)
todo_subtask(id, todo_id, title, done)
todo_log(id, todo_id, member_id, action, at)
```

### 6.4 购买清单
```sql
shop_list(id, family_id, name, status, created_by, created_at)
shop_item(id, list_id, name, qty, unit, est_price, category, priority,
          bought, buyer_id, actual_price, bought_at, note)
shop_template(id, family_id, name, items_json)
```

### 6.5 日程
```sql
event_item(id, family_id, title, type, start_at, end_at, all_day, location,
           note, repeat_rule, created_by, created_at)
event_participant(event_id, member_id)
event_reminder(event_id, offset_minutes)
```

> 所有业务表均含 `family_id` 用于未来多家庭扩展；V1 查询默认绑定当前家庭。

---

## 7. 架构与目录结构（建议）

```
family-hub/
├── apps/
│   └── web/                      # React + Vite PWA
│       ├── src/
│       │   ├── modules/          # 各功能模块（可组合）
│       │   │   ├── bill/         # 账单
│       │   │   ├── todo/         # 待办
│       │   │   ├── shopping/     # 购买清单
│       │   │   ├── calendar/     # 日程
│       │   │   └── workspace/    # 工作台
│       │   ├── core/             # 公共能力
│       │   │   ├── auth/         # 设备+PIN 认证
│       │   │   ├── api/          # 请求封装
│       │   │   ├── notify/       # Web Push 注册
│       │   │   ├── offline/      # 离线/同步队列
│       │   │   └── ui/           # 基础组件库
│       │   ├── layout/           # 布局、导航
│       │   ├── registry/         # 模块注册中心（可组合扩展的关键）
│       │   └── App.tsx
│       ├── public/
│       │   ├── manifest.json     # PWA manifest
│       │   └── sw.js             # Service Worker（Workbox）
│       └── vite.config.ts
├── workers/
│   └── api/                      # Cloudflare Workers（Hono 框架）
│       ├── src/
│       │   ├── routes/           # 路由：/bill /todo /shop /event /auth ...
│       │   ├── modules/          # 各业务模块的服务层
│       │   ├── middleware/       # 认证、错误处理、日志
│       │   ├── db/               # D1 schema、迁移、查询
│       │   ├── notify/           # 飞书机器人 + Web Push 发送
│       │   └── index.ts
│       ├── migrations/           # D1 SQL 迁移
│       └── wrangler.toml
├── packages/
│   └── shared/                   # 前后端共享类型、枚举、校验
└── docs/
    ├── PRD.md
    ├── 架构设计.md
    ├── UI设计规范.md
    ├── 交互设计.md
    └── 详细设计.md
```

**可组合扩展的关键设计**：
- 前端 `modules/*` 每个模块自包含（路由 / 组件 / 状态 / API 调用）
- 通过 `registry/` 注册到工作台与导航，新增模块只改一处
- 后端 `workers/api/modules/*` 同样按模块组织，独立路由
- `packages/shared` 共享 TS 类型，保证前后端契约

---

## 8. CI/CD 流程（GitHub → Cloudflare）

```
GitHub push/merge → main
        │
        ├─ Cloudflare Pages：自动构建 web/（pnpm build）→ 部署生产
        ├─ Cloudflare Workers：wrangler deploy（workers/api）
        ├─ D1 migrations：wrangler d1 migrations apply
        └─ PR 时：生成 Preview Deployment（独立预览 URL）
```

- **分支策略**：`main` 为生产，`dev` 为集成，feature 分支开发
- **环境变量 / 密钥**：飞书 webhook、VAPID 密钥、D1 绑定等通过 Cloudflare Dashboard / wrangler secret 管理，不入库
- **回滚**：Cloudflare 支持一键回滚到历史部署

---

## 9. 开发阶段规划（MVP → 完整版）

### Phase 1 — 基础设施（1 周）
- Monorepo 脚手架（pnpm workspaces）+ React + Vite + Workers + Hono
- Cloudflare 资源开通：D1、R2、KV、Pages
- 认证骨架：设备认证 + PIN 登录 + 会话
- 模块注册中心 + 工作台空壳
- PWA manifest + Service Worker 骨架
- CI/CD 接通（GitHub → Cloudflare 自动部署）

### Phase 2 — 账单模块（1 周）
- 记账 CRUD + 分类体系（一二级 + 图标）+ 标签
- 导入功能（CSV/Excel + 模板 + 去重校验）
- 分析图表（总览 / 趋势 / 结构 / 对比 / 标签视图）
- 周期账单 + 预算

### Phase 3 — 待办 + 购买清单（1 周）
- 待办 CRUD + 重复 + 看板视图
- 购买清单 + 购买流程 + 联动账单

### Phase 4 — 日程模块（3~5 天）
- 日历视图 + 日程 CRUD + 重复
- 提醒规则

### Phase 5 — 通知与推送（3~5 天）
- 飞书群机器人接入 + 按类型推送
- Web Push 订阅与发送
- 通知中心 + 偏好设置
- 定时任务（Workers Cron）触发提醒

### Phase 6 — 打磨与发布（3~5 天）
- 离线模式完善
- 数据备份 / 导出 / 导入
- 深色模式
- 安装引导、性能优化

---

## 10. 待确认 / 开放问题

1. **飞书机器人类型**：V1 用自定义机器人（webhook，仅推送）？还是直接申请飞书应用（可交互卡片 / 回调）？建议 V1 webhook，V2 升级应用。
2. **数据备份频率**：自动每日备份到 R2 是否足够？
3. **离线写入冲突**：多成员同时离线编辑同一记录时，"最后写入"还是"字段级合并"？建议 V1 最后写入 + 冲突提示。
4. **iOS Web Push**：iOS 16.4+ 才支持且需"添加到主屏幕"，是否在引导中说明？飞书通道可弥补。
5. **小票图片**：是否需要在上传前压缩 / 裁剪？

---

## 11. 后续可扩展模块（不在 V1 范围）

- 家庭菜谱与周菜单计划
- 家电 / 物品保修期与说明书管理
- 宠物健康记录
- 家庭图书 / 影音收藏
- 健康打卡（运动、体重）
- 儿童作业 / 学习计划
- 飞书应用升级（交互卡片、消息回调）
