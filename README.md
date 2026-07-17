# Limen (Next.js 重构版)

这是一个使用 Next.js 15 重构的个人日记应用，具有 AI 自动生成标题、摘要和标签的功能。

## 技术栈

- **框架**: Next.js 15 (App Router)
- **数据库**: SQLite + Drizzle ORM
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
SESSION_SECRET=加密用的随机字符串

# AI 配置
AI_API_KEY=你的 OpenAI API Key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini

# SQLite 数据库文件
DATABASE_URL=sqlite:///./data/limen.db
```

### 3. 初始化数据库

```bash
npx drizzle-kit push
```

### 4. 启动开发服务器

```bash
npm run dev
```

### 5. 运行自动化测试

```bash
npm test
```

该命令会运行 Node-based 自动化测试套件，覆盖认证、条目创建、AI 处理、路由保护、页面状态和前端配置回归。

## Docker 部署

```bash
docker compose up -d --build
```

默认会把宿主机的 `./data` 挂载到容器内的 `/app/data`，并使用 `.env` 里的 `DATABASE_URL`。如果你沿用默认值 `sqlite:///./data/limen.db`，数据库文件会稳定落在仓库下的 `data/limen.db`。

## API 说明

所有 API 均需在 Header 中包含 `Authorization: Bearer <AUTH_PASSWORD>`。

- `POST /api/entries`: 创建新条目 (body: `{ "content": "..." }`)，成功返回 `201` 和 `{ "id": "...", "status": "created", "aiStatus": "pending" }`
- `GET /api/entries`: 获取条目列表 (query: `limit`, `offset`)
- `GET /api/entries/[id]`: 获取条目详情
- `DELETE /api/entries/[id]`: 删除条目

快捷指令应使用 `POST`、`Content-Type: application/json` 和 `Authorization: Bearer <AUTH_PASSWORD>`。只在响应 JSON 的 `status` 等于 `created` 且 `id` 非空时提示成功；不要用“URL 的内容有任何值”判断成功，因为错误响应也有 JSON 内容。成功后可用返回的 `id` 请求 `GET /api/entries/{id}` 验证条目已落库。

## 特性

- **异步 AI 处理**: 利用 Next.js 15 的 `after()` API，在创建条目后自动触发 AI 处理，不阻塞用户响应。
- **全文搜索**: 支持通过关键字搜索日记内容、标题和标签。
- **响应式设计**: 适配桌面和移动端。
