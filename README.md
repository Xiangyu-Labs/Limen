# Limen

Limen 是一个使用 Next.js 16 App Router 构建的个人日记应用，具有 AI 自动生成标题、摘要和标签的功能。

## 技术栈

- **框架**: Next.js 16 (App Router) + React 19
- **数据库**: Neon Postgres + Drizzle ORM
- **样式**: Tailwind CSS + Shadcn/ui
- **AI**: OpenAI API (异步处理)
- **认证**: 单一明文密码（Web Session / Bearer API 共用）

## 快速开始

### 前置要求

- Node.js 24.x
- npm 11
- Neon Postgres 数据库

### 1. 安装依赖

```bash
nvm use
npm install
```

### 2. 配置环境变量

复制 `.env.example` 并填写相关信息：

```bash
cp .env.example .env.local
```

所有环境变量说明见 [docs/deployment.md](docs/deployment.md#环境变量)。

### 3. 初始化数据库

```bash
npm run db:migrate
```

修改 schema 后，先运行 `npm run db:generate` 并提交生成的迁移，再运行 `npm run db:migrate`。

### 4. 启动开发服务器

```bash
npm run dev
```

### 5. 运行自动化检查

```bash
npm run check
```

该命令顺序执行格式检查、lint、类型检查和测试。测试覆盖统一密码认证、登录限流、会话、草稿、cursor 分页、条目操作、AI 分段处理、安全响应头和交互 pending 状态。

## npm scripts

| 命令                   | 说明                                            |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | 启动 Next.js 开发服务器                         |
| `npm run build`        | 生产构建                                        |
| `npm run start`        | 启动生产服务器                                  |
| `npm run test`         | 运行测试                                        |
| `npm run lint`         | ESLint 检查                                     |
| `npm run lint:fix`     | 自动修复 ESLint 问题                            |
| `npm run typecheck`    | TypeScript 类型检查                             |
| `npm run format`       | Prettier 格式化                                 |
| `npm run format:check` | Prettier 格式检查                               |
| `npm run check`        | 顺序执行 format:check + lint + typecheck + test |
| `npm run db:generate`  | Drizzle 生成迁移文件                            |
| `npm run db:migrate`   | 执行迁移                                        |

## 详细文档

- [API 参考](docs/api.md) — REST API 端点、认证、分页、请求/响应示例
- [部署指南](docs/deployment.md) — Neon/Vercel 配置、环境变量、迁移、凭证轮换

## 特性

- **异步 AI 处理**: 利用 Next.js `after()` API 处理元数据；长文按约 30,000 字符分段并在最后汇总。页面仅在存在待处理条目、可见且联网时自适应检查状态（前 15 秒每 3 秒、随后至 60 秒每 10 秒、之后每 30 秒持续检查）。
- **可靠输入**: Web 新建和编辑会自动保存浏览器本地草稿，正式写入失败时正文不会被清除。
- **私有访问**: 一个 `AUTH_PASSWORD` 同时用于登录和 Bearer API，保留 IP 登录限流、7 天会话和 nonce CSP。
- **即时反馈**: 保存、搜索、删除、重新整理和导航都提供 pending、toast、乐观状态或 skeleton。
- **时间线**: 服务端首屏加 cursor 无限滚动，只向浏览器发送列表所需字段。
- **搜索**: 支持按正文、标题和摘要搜索，SQL 通配符按普通字符处理。
- **响应式设计**: 适配桌面和移动端。
