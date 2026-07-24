# 部署指南

## 数据库 (Neon)

### 创建数据库

1. 在 [Neon](https://neon.tech) 中选择**新加坡 (ap-southeast-1)** 区域创建项目
2. 在项目仪表盘获取连接串，格式：`postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/limen?sslmode=require`

### 执行迁移

迁移使用 Neon HTTP 驱动，不会在构建或冷启动时自动执行：

```bash
npm run db:migrate
```

修改 schema 后：

```bash
npm run db:generate   # 生成迁移文件
npm run db:migrate    # 执行迁移
```

提交生成的迁移文件到版本控制。

## Vercel 部署

### 构建配置

Vercel 的 Build and Output Settings 使用以下默认设置即可：

- **Framework Preset**: `Next.js`
- **Build Command**: 保持默认（`next build`，项目脚本等价于 `npm run build`）
- **Output Directory**: 保持默认（Next.js 使用 `.next`）
- **Install Command**: 保持默认（`npm install`）
- **Root Directory**: 仓库根目录

`package.json` 的 `engines.node` 已固定为 `24.x`，Vercel 会据此选择 Node.js 24。

### 环境变量

在 Vercel 项目设置中配置以下环境变量：

| 变量                 | 必须 | 说明                                                                  |
| -------------------- | ---- | --------------------------------------------------------------------- |
| `DATABASE_URL`       | 是   | Neon Postgres 连接串，推荐通过 Vercel Marketplace 连接 Neon           |
| `AUTH_PASSWORD_HASH` | 是   | scrypt 密码哈希，运行 `npm run auth:hash-password` 生成               |
| `API_TOKEN_HASH`     | 是   | API Token 的 sha256 哈希，运行 `npm run auth:generate-api-token` 生成 |
| `SESSION_SECRET`     | 是   | 会话加密密钥，至少 32 字节高熵随机值，例如 `openssl rand -base64 32`  |
| `AI_API_KEY`         | 是   | OpenAI API Key                                                        |
| `AI_BASE_URL`        | 是   | OpenAI API 基础 URL，默认 `https://api.openai.com/v1`                 |
| `AI_MODEL`           | 是   | AI 模型名称，默认 `gpt-4o-mini`                                       |

**可选变量:**

| 变量                  | 说明                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `ALLOWED_DEV_ORIGINS` | 仅用于本地开发，配置允许跨域访问的开发地址。取值以逗号分隔（如 `localhost,192.168.1.100`）。在生产环境（Vercel）无需配置 |

请参考 `.env.example` 获取完整的变量格式说明。

### 部署步骤

1. 在 Neon 新加坡区域创建数据库，并通过 Vercel Marketplace 连接或手动配置 `DATABASE_URL`
2. 对目标数据库执行 `npm run db:migrate`
3. 生成凭证并写入 Vercel 环境变量：
   - 运行 `npm run auth:hash-password`，将输出的 `AUTH_PASSWORD_HASH` 填入
   - 运行 `npm run auth:generate-api-token`，将 `API_TOKEN_HASH` 填入，并将原始 Token 保存到密码管理器
4. 配置 `SESSION_SECRET`、`AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL`
5. 部署应用
6. 验证部署（见下文）

## 凭证生成与轮换

### 生成密码哈希

```bash
npm run auth:hash-password
```

交互式输入密码，输出 scrypt 哈希。密码必须 **14-128 字符**。

### 生成 API Token

```bash
npm run auth:generate-api-token
```

输出 256-bit 随机 Token（base64url 编码）及其 sha256 哈希。原始 Token **仅显示一次**，请立即保存到密码管理器。

### 轮换 SESSION_SECRET

轮换 `SESSION_SECRET` 会立即注销全部浏览器会话。建议在 Vercel 中直接更新环境变量并重新部署。

### 轮换 API Token

1. 运行 `npm run auth:generate-api-token` 生成新 Token
2. 将 `API_TOKEN_HASH` 更新到 Vercel 并部署
3. 将所有 API 客户端更新为新 Token
4. 旧 Token 随部署立即失效

### 删除旧密码明文

验证部署成功后，从 Vercel 删除之前可能存在的 `AUTH_PASSWORD` 明文变量。应用只存储和验证 scrypt 哈希。

## 部署验证

部署后验证以下功能是否正常：

1. **登录**: 使用已配置密码登录 Web 界面
2. **创建条目**: 在 Web 界面或通过 API 创建新条目
3. **搜索**: 搜索创建的条目
4. **AI 回写**: 等待 AI 处理完成，确认条目生成标题、摘要和标签
5. **删除条目**: 删除条目确认
6. **退出登录**: 退出后会话应失效

### API 验证示例

```bash
# 创建条目
curl -X POST https://your-app.vercel.app/api/entries \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"测试条目内容","createdAt":"2026-07-24"}'

# 列条目
curl https://your-app.vercel.app/api/entries?limit=5 \
  -H "Authorization: Bearer <token>"

# 获取详情
curl https://your-app.vercel.app/api/entries/<id> \
  -H "Authorization: Bearer <token>"
```

## 运行时说明

- **区域**: Functions (sin1) 与 Neon (ap-southeast-1) 均使用新加坡区域以降低延迟
- **超时**: AI 后台任务最长运行 60 秒 (`maxDuration = 60`)
- **迁移**: 数据库迁移不自动执行，需手动运行 `npm run db:migrate`
- **构建**: Vercel Framework Preset 为 `Next.js`，Build Command 使用默认值

## 安全注意事项

- 本应用为**单用户设计**，API 无用户层级权限控制
- `AUTH_PASSWORD_HASH`、`API_TOKEN_HASH`、`SESSION_SECRET` 视为敏感信息
- 部署后应验证安全响应头和非ce CSP 是否正常工作
- 建议定期轮换 API Token 和 SESSION_SECRET
