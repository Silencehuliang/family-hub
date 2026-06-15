# 家庭管家 (Family Hub)

一个 PWA 家庭管理工具集,支持家庭账单、待办、购物清单、重要日程提醒,可组合扩展,部署于 Cloudflare。

> 当前阶段:**Phase 1 — 基础设施**(脚手架 / 认证 / 迁移 / PWA / CI/CD)

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
│   └── web/              # React + Vite PWA 前端
├── workers/
│   └── api/              # Cloudflare Workers (Hono) 后端
├── packages/
│   └── shared/           # 前后端共享类型、zod schema、枚举
├── docs/                 # 产品文档 (PRD/架构/UI/交互/详细设计)
└── .github/workflows/    # CI/CD
```

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

### Cloudflare 资源(首次需手动创建)
1. 创建 D1 数据库:`wrangler d1 create family-hub` → 把 `database_id` 填入 `workers/api/wrangler.toml`
2. 创建 R2 存储桶:`wrangler r2 bucket create family-hub-assets`
3. 创建 KV 命名空间:`wrangler kv namespace create KV` → 把 `id` 填入 `wrangler.toml`
4. 应用远程迁移:`pnpm db:migrate:remote`
5. 设置 Secrets:
   ```bash
   cd workers/api
   wrangler secret put VAPID_PRIVATE_KEY
   wrangler secret put CONFIG_ENCRYPTION_KEY
   ```

### CI/CD
- 推送到 `main` 分支 → GitHub Actions 自动构建并部署
- PR 触发 CI(lint + typecheck + build),不部署
- 需在 GitHub 仓库 Secrets 中配置 `CF_API_TOKEN`、`CF_ACCOUNT_ID`

## 文档
详见 `docs/` 目录:
- `PRD.md` — 产品需求规格
- `架构设计.md` — 总体架构、认证、通知、CI/CD
- `UI设计规范.md` — 色彩、字体、组件规范
- `交互设计.md` — 用户流程、页面交互
- `详细设计.md` — 数据模型、API 契约、模块实现
