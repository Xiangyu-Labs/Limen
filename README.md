# Limen

这是一个使用 Next.js 16 App Router 构建的个人日记应用，具有 AI 自动生成标题、摘要和标签的功能。

## 技术栈

- **框架**: Next.js 16 (App Router) + React 19
- **数据库**: Neon Postgres + Drizzle ORM
- **样式**: Tailwind CSS + Shadcn/ui
- **AI**: OpenAI API (异步处理)
- **认证**: Session-based (Web) / Bearer Token (API)

## 快速开始

### 1. 安装依赖

```bash
nvm use
npm install
```

本项目和 Vercel 均使用 Node.js 24。

### 2. 配置环境变量

复制 `.env.example` 并填写相关信息：

```bash
# 先运行 npm run auth:hash-password 生成
AUTH_PASSWORD_HASH=scrypt$32768$8$1$...

# 先运行 npm run auth:generate-api-token 生成
API_TOKEN_HASH=sha256$...

# 至少 32 bytes，例如 openssl rand -base64 32
SESSION_SECRET=高熵随机密钥

# AI 配置
AI_API_KEY=你的 OpenAI API Key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini

# Neon Postgres 连接串
DATABASE_URL=postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/limen?sslmode=require
```

浏览器密码必须至少 14 字符，只保存 scrypt 哈希。API 使用独立的 256-bit Token；生成命令会显示一次原始 Token，应存入密码管理器和 API 客户端，服务端只保存哈希。

推荐在 Neon 创建新加坡区域的项目，并通过 Vercel Marketplace 连接项目。数据库迁移使用 Neon HTTP，不会在构建或函数冷启动时自动执行：

```bash
npm run db:migrate
```

修改 schema 后，先运行 `npm run db:generate` 并提交生成的迁移，再对目标数据库运行 `npm run db:migrate`。

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 运行自动化检查

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

测试覆盖密码哈希、登录限流、严格会话、API Token、cursor 分页、条目操作、AI 分段处理、安全响应头和交互 pending 状态。

## Vercel 部署

1. 在 Neon 新加坡区域创建数据库，并在 Vercel 中连接该数据库。
2. 运行 `npm run auth:hash-password`，把输出的 `AUTH_PASSWORD_HASH` 写入 Vercel。
3. 运行 `npm run auth:generate-api-token`，把 `API_TOKEN_HASH` 写入 Vercel，并把原始 Token 更新到快捷指令等 API 客户端。
4. 配置 `DATABASE_URL`、高熵 `SESSION_SECRET`、`AI_API_KEY`、`AI_BASE_URL` 和 `AI_MODEL`。
5. 对目标 Neon 数据库执行 `npm run db:migrate`，创建登录限流表。
6. 更新所有 API 客户端使用新生成的原始 Token，然后部署并验证登录、创建、搜索、AI 回写、删除和退出。
7. 验证成功后，从 Vercel 删除旧的 `AUTH_PASSWORD`。

Vercel 的 Build and Output Settings 使用以下设置即可：

- Framework Preset: `Next.js`
- Build Command: 保持默认（`next build`，项目脚本等价于 `npm run build`）
- Output Directory: 保持默认，不填写（Next.js 使用 `.next`）
- Install Command: 保持默认（`npm install`）
- Root Directory: 仓库根目录

`package.json` 的 `engines.node` 已固定为 `24.x`，Vercel 会据此选择 Node.js 24。Functions 与 Neon 均使用新加坡区域，AI 后台任务最长运行 60 秒。

轮换 `SESSION_SECRET` 会立即注销全部浏览器会话。轮换 API Token 时，先生成并部署新哈希，再更新所有客户端；旧 Token 随部署立即失效。

## API 说明

所有 API 均需在 Header 中包含 `Authorization: Bearer <独立API_TOKEN>`。

- `POST /api/entries`: 创建新条目（body: `{ "content": "...", "createdAt": "YYYY-MM-DD" }`），正文最多 200,000 字符
- `GET /api/entries`: cursor 分页获取条目（query: `limit`, `cursor`；`limit` 默认 20、最大 100）
- `GET /api/entries/[id]`: 获取条目详情
- `DELETE /api/entries/[id]`: 删除条目

快捷指令应使用 `POST`、`Content-Type: application/json` 和独立 API Token。只在响应 JSON 的 `status` 等于 `created` 且 `id` 非空时提示成功；不要用“URL 的内容有任何值”判断成功，因为错误响应也有 JSON 内容。

列表响应格式：

```json
{
  "items": [],
  "pageInfo": {
    "nextCursor": null,
    "hasMore": false,
    "limit": 20
  }
}
```

当 `hasMore` 为 `true` 时，将 `nextCursor` 原样传入下一次请求；旧的 `offset` 参数不再支持。

## 特性

- **异步 AI 处理**: 利用 Next.js `after()` API 处理元数据；长文按约 30,000 字符分段并在最后汇总。页面仅在存在待处理条目时每 2 秒刷新，并在完成、失败或 60 秒后停止。
- **私有访问**: scrypt 密码哈希、IP 登录限流、7 天严格会话、独立 API Token、默认拒绝路由和 nonce CSP。
- **即时反馈**: 保存、搜索、删除、重新整理和导航都提供 pending、toast、乐观状态或 skeleton。
- **时间线**: 服务端首屏加 cursor 无限滚动，只向浏览器发送列表所需字段。
- **搜索**: 支持按正文、标题和摘要搜索，SQL 通配符按普通字符处理。
- **响应式设计**: 适配桌面和移动端。
