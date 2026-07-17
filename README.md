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
npm install
```

### 2. 配置环境变量

复制 `.env.example` 并填写相关信息：

```bash
# 基础配置
AUTH_PASSWORD=你的访问密码
SESSION_SECRET=至少32字符的独立随机密钥

# AI 配置
AI_API_KEY=你的 OpenAI API Key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini

# Neon Postgres 连接串
DATABASE_URL=postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/limen?sslmode=require
```

推荐在 Neon 创建新加坡区域的项目，并通过 Vercel Marketplace 连接项目。数据库迁移不会在构建或函数冷启动时自动执行；首次部署和每次 schema 变更都应显式运行：

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

测试覆盖认证、cursor 分页、条目创建、AI 分段处理、路由保护、页面状态和部署配置；项目不包含浏览器 E2E 测试。

## Vercel 部署

1. 在 Neon 新加坡区域创建数据库，并在 Vercel 中连接该数据库。
2. 在 Vercel 的 Production、Preview 和 Development 环境分别配置 `DATABASE_URL`、`AUTH_PASSWORD`、`SESSION_SECRET`、`AI_API_KEY`、`AI_BASE_URL` 和 `AI_MODEL`。
3. 将 Vercel 环境变量拉取到 `.env.local`，对目标 Neon 数据库执行 `npm run db:migrate`。
4. 如需迁移原 SQLite 数据，在应用正式写入 Neon 前执行下面的一次性导入。
5. 部署 Git 仓库。应用的 Node.js Functions 和 Neon 均使用新加坡区域，AI 后台任务最长运行 60 秒。

### 导入现有 SQLite 数据

导入命令必须显式指定源文件，不会猜测数据库路径：

```bash
npm run db:import-sqlite -- --source /absolute/path/to/limen.db
```

导入器只迁移 `entries`。它会在写入前逐字段比较 Neon 中的同 ID 记录：相同记录跳过，内容不同则中止且不插入其他记录。写入完成后会重新读取并校验全部源记录，因此该命令可以安全重试。请保留原 SQLite 文件，直到导入校验和线上冒烟测试均完成。

## API 说明

所有 API 均需在 Header 中包含 `Authorization: Bearer <AUTH_PASSWORD>`。

- `POST /api/entries`: 创建新条目（body: `{ "content": "...", "createdAt": "YYYY-MM-DD" }`），正文最多 200,000 字符
- `GET /api/entries`: cursor 分页获取条目（query: `limit`, `cursor`；`limit` 默认 20、最大 100）
- `GET /api/entries/[id]`: 获取条目详情
- `DELETE /api/entries/[id]`: 删除条目

快捷指令应使用 `POST`、`Content-Type: application/json` 和 `Authorization: Bearer <AUTH_PASSWORD>`。只在响应 JSON 的 `status` 等于 `created` 且 `id` 非空时提示成功；不要用“URL 的内容有任何值”判断成功，因为错误响应也有 JSON 内容。成功后可用返回的 `id` 请求 `GET /api/entries/{id}` 验证条目已落库。

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
- **时间线**: 服务端首屏加 cursor 无限滚动，只向浏览器发送列表所需字段。
- **搜索**: 支持按正文、标题和摘要搜索，SQL 通配符按普通字符处理。
- **响应式设计**: 适配桌面和移动端。
