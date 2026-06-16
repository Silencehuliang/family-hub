# 家庭管家 (Family Hub)

一个 PWA 家庭管理工具集,支持家庭账单、待办、购物清单、重要日程提醒,可组合扩展,部署于 Cloudflare。

> 当前阶段:**Phase 5 — 通知与推送**(Phase 1~4 已完成：认证 / 账单 / 待办 / 购物清单 / 日程)

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + Vite 5 + TypeScript + Ant Design 5 |
| 后端 | Cloudflare Workers + Hono 4 |
| 数据库 | Cloudflare D1 (SQLite) |
| 对象存储 | Cloudflare R2 |
| 缓存/会话 | Cloudflare KV |
| 通知 | 飞书群机器人 (主) + Web Push (辅) |
| 部署 | GitHub → Cloudflare CI/CD |
| Monorepo | pnpm workspaces |

## 目录结构

```
family-hub/
├── apps/
│   └── web/                    # React + Vite PWA 前端
│       ├── src/
│       │   ├── core/           # 公共能力(auth/api/theme/hooks)
│       │   ├── layout/         # 响应式布局(移动 Tab / PC 侧栏)
│       │   ├── modules/        # 5 个业务模块
│       │   │   ├── bill/       # 账单(CRUD + 统计 + 导入)
│       │   │   ├── todo/       # 待办(CRUD + 子任务)
│       │   │   ├── shop/       # 购物清单(CRUD + 联动账单)
│       │   │   ├── calendar/   # 日程(月视图)
│       │   │   └── workspace/  # 工作台仪表盘
│       │   ├── pages/          # 公开页(欢迎/登录/创建家庭等)
│       │   └── registry/       # 模块注册中心(扩展关键)
│       └── vite.config.ts
├── workers/
│   └── api/                    # Cloudflare Workers (Hono)
│       ├── src/
│       │   ├── middleware/     # 认证/日志/错误处理
│       │   ├── modules/        # 5 个模块的服务层
│       │   ├── routes/         # 8 个路由文件
│       │   └── db/             # D1 客户端
│       ├── migrations/         # 7 个 SQL 迁移文件
│       └── wrangler.toml
├── packages/
│   └── shared/                 # 共享类型/zod schema/枚举/常量
├── docs/                       # 产品文档
└── .github/workflows/          # CI/CD

## 本地开发

### 前置要求
- Node.js ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm` 或 `corepack enable`)

### 安装与启动

```bash
# 1. 安装依赖
pnpm install

# 2. 应用本地数据库迁移(含分类种子数据)
pnpm db:migrate:local

# 3. 同时启动前端和后端(并行)
pnpm dev
# 或分别启动:
pnpm dev:api   # 后端 wrangler dev (http://localhost:8787)
pnpm dev:web   # 前端 Vite dev (http://localhost:5173, 代理 API 到 8787)
```

### 首次使用流程
1. 打开 `http://localhost:5173`
2. 点击「创建家庭」→ 填写家庭名 + 昵称 + 设置 PIN → 成为管理员
3. 后续打开应用:输入 PIN 即可登录(设备已信任)

## 部署

### Cloudflare 资源(已创建)
| 资源 | ID | 状态 |
|------|-----|------|
| D1 数据库 `family-hub` | `1cad1db6-e65c-4a21-8313-5f14ef1255ba` | ✅ 已创建 |
| KV 命名空间 | `3686d84ff19d4e788a126e4b925e7216` | ✅ 已创建 |
| R2 存储桶 `family-hub-assets` | — | ⏸ 暂不使用（需时取消注释 `wrangler.toml` 和 `env.ts`） |

### 首次部署流程

```bash
# 1. 确保已登录 Cloudflare
npx wrangler whoami

# 2. 创建 D1 数据库(如未创建)
npx wrangler d1 create family-hub

# 3. 创建 KV 命名空间(如未创建)
npx wrangler kv namespace create KV

# 4. 创建 R2 存储桶(需要先启用 R2)
npx wrangler r2 bucket create family-hub-assets

# 5. 应用远程数据库迁移
pnpm db:migrate:remote

# 6. 设置 Secrets(仅首次)
npx wrangler secret put VAPID_PRIVATE_KEY
npx wrangler secret put CONFIG_ENCRYPTION_KEY
```

### CI/CD

| 分支 | 触发 | 行为 |
|------|------|------|
| `main` | push | 构建 + 部署 Workers + 应用 D1 迁移 + 部署 Pages |
| `dev` | push | 仅 CI 检查(lint + typecheck + build) |
| 任意 | PR → `main`/`dev` | 仅 CI 检查 |

**前置条件** — 在 GitHub 仓库设置 Secrets:
| Secret | 值 |
|--------|-----|
| `CF_API_TOKEN` | Cloudflare API Token(权限: Workers/D1/Pages/KV 编辑) |
| `CF_ACCOUNT_ID` | `55bbf1431c6d6ea28b1237b601cc1338` |

## 文档
详见 `docs/` 目录:
- `PRD.md` — 产品需求规格
- `架构设计.md` — 总体架构、认证、通知、CI/CD
- `UI设计规范.md` — 色彩、字体、组件规范
- `交互设计.md` — 用户流程、页面交互
- `详细设计.md` — 数据模型、API 契约、模块实现
