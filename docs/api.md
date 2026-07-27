# API 参考

Limen 提供两类 API：

- **Bearer Token API**: 用于快捷指令、脚本等外部客户端。所有端点需在 `Authorization` 请求头中携带 `AUTH_PASSWORD`。
- **Session API**: 用于 Web 前端，基于浏览器会话。不需要携带 Token。

## 认证

### Bearer Token

所有条目 API 端点均要求 `Authorization: Bearer <password>` 请求头，其中 `<password>` 与 Web 登录使用的明文 `AUTH_PASSWORD` 完全相同。

```bash
curl -H "Authorization: Bearer <AUTH_PASSWORD>" <url>
```

如果 Token 缺失或无效，返回 `401`：

```json
{ "error": "Unauthorized" }
```

服务端只需配置一个明文 `AUTH_PASSWORD` 环境变量，不使用密码哈希、独立 API Token 或独立 Session Secret。

## 条目 API

所有端点路径前缀为 `/api/entries`。

---

### POST /api/entries

创建新条目。

**请求体:**

```json
{
  "content": "今日日记内容，最多 200,000 字符",
  "createdAt": "2026-07-24"
}
```

- `content` (必填): 字符串，至少 1 字符，最多 200,000 字符
- `createdAt` (选填): `YYYY-MM-DD` 格式日期。省略时默认为服务器当前日期（UTC）

**响应 (201):**

```json
{
  "id": "abc123def456",
  "status": "created",
  "aiStatus": "pending"
}
```

响应同时包含 `Location: /api/entries/<id>`。只有收到 HTTP 201、`status` 为 `created` 且 `id` 非空，才表示数据库已经确认写入。

AI 处理在后台异步进行。可通过 GET 获取详情检查 `aiStatus` 变化。

**错误响应:**

- `400` — 请求体格式错误或参数校验失败
- `401` — 缺少或无效的 Authorization 请求头
- `413` — 内容超出 200,000 字符限制
- `500` — 服务器内部错误

---

### GET /api/entries

cursor 分页获取条目列表。

**查询参数:**

| 参数     | 类型    | 默认值 | 说明                                    |
| -------- | ------- | ------ | --------------------------------------- |
| `limit`  | integer | 20     | 每页条目数，最小值 1，最大值 100        |
| `cursor` | string  | —      | 分页游标，从上次响应中获取 `nextCursor` |

**响应 (200):**

```json
{
  "items": [
    {
      "id": "abc123def456",
      "content": "...",
      "title": null,
      "summary": null,
      "tags": null,
      "aiStatus": "pending",
      "source": "web",
      "createdAt": "2026-07-24T00:00:00.000Z",
      "updatedAt": null
    }
  ],
  "pageInfo": {
    "nextCursor": "eyJ2IjoxLCJjcmVhdGVkQXQiOiIyMDI2LTA3LTI0V...",
    "hasMore": true,
    "limit": 20
  }
}
```

- 按 `createdAt`、实际录入时间、`id` 依次降序排列；同一天最后录入的日记最先显示
- 当 `hasMore` 为 `true` 时，将 `nextCursor` 原样传入下一次请求
- 旧版 `offset` 参数不再支持

---

### GET /api/entries/[id]

获取单个条目详情。

**路径参数:**

| 参数 | 说明    |
| ---- | ------- |
| `id` | 条目 ID |

**响应 (200):**

返回完整的条目数据库记录：

```json
{
  "id": "abc123def456",
  "content": "...",
  "title": "...",
  "summary": "...",
  "tags": "[\"tag1\",\"tag2\"]",
  "aiStatus": "done",
  "source": "web",
  "createdAt": "2026-07-24T00:00:00.000Z",
  "updatedAt": "2026-07-24T00:01:00.000Z"
}
```

- `aiStatus` 取值: `pending` (待处理)、`done` (完成)、`failed` (失败)
- `tags` 为 JSON 字符串，解析后为字符串数组
- `source` 取值: `web`

**响应 (404):**

```json
{ "error": "Entry not found" }
```

---

### DELETE /api/entries/[id]

删除条目。

**响应 (200):**

```json
{ "success": true }
```

**响应 (404):**

```json
{ "error": "Entry not found" }
```

## 仪表盘 API (Session)

Web 前端使用的端点，基于浏览器会话认证，而非 Bearer Token。

---

### GET /api/dashboard/entries

获取仪表盘时间线条目列表。

**查询参数:**

| 参数     | 类型   | 默认值 | 说明                             |
| -------- | ------ | ------ | -------------------------------- |
| `cursor` | string | —      | 分页游标                         |
| `q`      | string | —      | 搜索关键词，搜索正文、标题和摘要 |

**响应 (200):**

```json
{
  "items": [
    {
      "id": "abc123def456",
      "displayTitle": "日记标题",
      "displaySummary": "预览文字（最长 280 字符）",
      "tags": ["tag1", "tag2"],
      "statusLabel": null,
      "statusTone": "muted",
      "createdAt": "2026-07-24T00:00:00.000Z",
      "isPending": false
    }
  ],
  "pageInfo": {
    "nextCursor": "...",
    "hasMore": false,
    "limit": 20
  }
}
```

- `statusLabel`: 当 `aiStatus` 为 `pending` 时显示"处理中"，`failed` 时显示"失败"
- `statusTone`: `danger` (failed) 或 `muted` (其他)
- `isPending`: `true` 表示 AI 处理尚未完成

## 分页说明

所有列表端点使用基于 cursor 的游标分页：

1. 首次请求不带 `cursor` 参数
2. 响应中的 `pageInfo.nextCursor` 作为下一次请求的 `cursor` 值
3. 当 `pageInfo.hasMore` 为 `false` 时表示已无更多数据
4. Bearer API 的 `limit` 参数控制每页条目数（默认 20，最大 100）；Session API 使用固定默认值
5. 游标内容不透明，应原样使用

## 快捷指令客户端

使用 Bearer Token 从快捷指令等外部客户端调用时：

- 使用 `POST` 方法和 `Content-Type: application/json`
- 使用 `Authorization: Bearer <AUTH_PASSWORD>`
- 只在响应 JSON 的 `status` 等于 `created` 且 `id` 非空时提示成功
- 同时检查 HTTP 状态码必须为 `201`；不要以“URL 的内容有任何值”判断成功，因为错误响应也有 JSON 内容
- 在确认成功前保留原始正文；失败时显示状态码和服务端 `error`，不要清空输入或剪贴板
- 如需二次确认，可使用返回的 `id` 请求 `GET /api/entries/<id>`
- 原始 Token 生成后仅显示一次，存入密码管理器

## 通用错误

| 状态码 | 说明                                 |
| ------ | ------------------------------------ |
| 400    | 请求格式错误或参数校验失败           |
| 401    | 未认证（Token 缺失、无效或会话过期） |
| 404    | 资源不存在                           |
| 413    | 请求体超出大小限制                   |
| 500    | 服务器内部错误                       |
