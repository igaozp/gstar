# gstar

个人 GitHub Star 管理工具。同步你的 star 数据，用 LLM 对每个项目做语义分析，然后用自然语言搜索它们。

## 功能

- **同步**：全量或增量拉取 GitHub star 数据（支持 ETag 缓存，增量同步按时间游标提前截断）
- **分析**：调用 LLM 为每个 star 项目生成摘要和关键词，并生成 embedding 向量
- **搜索**：支持三种策略——FTS5 关键词搜索、sqlite-vec 向量语义搜索、两者加权融合的 hybrid 搜索
- **前端**：Astro + shadcn/ui 界面，支持可视化搜索、浏览列表、项目详情、同步管理

## 快速开始

**环境要求：** Node.js 18+

```bash
# 1. 安装后端依赖
npm install

# 2. 配置后端环境变量
cp .env.example .env
# 编辑 .env，填入 GITHUB_TOKEN 和 LLM 相关配置

# 3. 安装前端依赖
cd app && npm install && cd ..

# 4. 配置前端环境变量
cp app/.env.example app/.env

# 5. 启动后端（终端1）
npm run dev          # http://localhost:3000

# 6. 启动前端（终端2）
npm run app:dev      # http://localhost:4321
```

访问 `http://localhost:4321` 使用 Web 界面，或直接调用 `http://localhost:3000` 的 REST API。

## 配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `GITHUB_TOKEN` | GitHub PAT，需要 `read:user` + `public_repo` 权限 | — |
| `GITHUB_USERNAME` | 你的 GitHub 用户名 | — |
| `LLM_PROVIDER` | `openai` / `anthropic` / `openai_compatible` | `openai` |
| `LLM_API_KEY` | LLM API 密钥 | — |
| `LLM_BASE_URL` | API 地址（OpenAI 留空，Ollama 填 `http://localhost:11434/v1`） | — |
| `LLM_CHAT_MODEL` | 用于分析的对话模型 | `gpt-4o-mini` |
| `LLM_EMBEDDING_MODEL` | 用于生成向量的 embedding 模型 | `text-embedding-3-small` |
| `LLM_EMBEDDING_DIMENSIONS` | embedding 维度，须与模型匹配 | `1536` |
| `DB_PATH` | SQLite 数据库文件路径 | `./data/gstar.db` |

**Anthropic 特别说明：** Anthropic 没有 embedding 接口，需额外配置一个 OpenAI 兼容的 embedding 端点：

```bash
LLM_PROVIDER=anthropic
LLM_API_KEY=sk-ant-xxx
LLM_CHAT_MODEL=claude-3-haiku-20240307
LLM_EMBEDDING_API_KEY=sk-openai-xxx   # 单独的 embedding 密钥
LLM_EMBEDDING_BASE_URL=https://api.openai.com/v1
```

**Ollama 本地部署：**

```bash
LLM_PROVIDER=openai_compatible
LLM_BASE_URL=http://localhost:11434/v1
LLM_API_KEY=ollama
LLM_CHAT_MODEL=llama3.2
LLM_EMBEDDING_MODEL=nomic-embed-text
LLM_EMBEDDING_DIMENSIONS=768
```

## API

### 同步

```bash
# 全量同步（首次使用）
curl -X POST http://localhost:3000/api/stars/sync \
  -H "Content-Type: application/json" \
  -d '{"type": "full"}'

# 增量同步（只拉取新增的 star）
curl -X POST http://localhost:3000/api/stars/sync \
  -d '{"type": "incremental"}'
```

### 搜索

```bash
# 关键词搜索（无需 LLM，随时可用）
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "react UI component", "strategy": "keyword"}'

# 语义搜索（需先完成分析）
curl -X POST http://localhost:3000/api/search \
  -d '{"query": "命令行工具", "strategy": "vector"}'

# Hybrid 搜索（默认，效果最好）
curl -X POST http://localhost:3000/api/search \
  -d '{"query": "kubernetes operator", "limit": 10}'
```

搜索请求参数：

| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `query` | string | 搜索词（支持中英文） | 必填 |
| `strategy` | `keyword` / `vector` / `hybrid` | 搜索策略 | `hybrid` |
| `limit` | number | 返回条数（最大 50） | `20` |
| `vectorWeight` | number (0–1) | hybrid 模式中向量分数权重 | `0.7` |

### 列表与详情

```bash
# API 入口
GET /api

# 获取 star 列表（支持分页和筛选）
GET /api/stars?page=1&limit=20&language=TypeScript&analyzed=true

# 获取单个 repo 详情（含 AI 摘要和关键词）
GET /api/stars/:id

# 服务状态（含同步进度和分析进度）
GET /api/health
```

### 配置

```bash
# 查看当前配置（token 已脱敏）
GET /api/config

# 动态更新配置（持久化到数据库）
PUT /api/config
Content-Type: application/json
{"llmChatModel": "gpt-4o"}
```

## 工作流程

全量同步完成后，`analyze:pending` 任务每 5 分钟自动处理一批未分析的项目（每批 10 个），直到处理完所有 star。分析完成前，搜索自动降级为 FTS5 关键词搜索，无需等待。

```
首次使用
  ↓
POST /api/stars/sync {"type":"full"}   ← 拉取所有 star
  ↓
analyze:pending (自动定时运行)          ← LLM 分析 + 生成向量
  ↓
POST /api/search {"query": "..."}      ← 语义搜索
```

增量同步每小时自动运行，也可手动触发。

## 构建与部署

```bash
npm run build          # 编译到 .output/
node .output/server/index.mjs   # 启动生产服务
```

数据库文件位于 `./data/gstar.db`（gitignore 中），请自行备份。

## 技术栈

**后端**
- [Nitro](https://nitro.build) — 服务框架
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) + [sqlite-vec](https://github.com/asg017/sqlite-vec) — 本地数据库 + 向量搜索
- [Drizzle ORM](https://orm.drizzle.team) — 数据库 Schema 管理
- [ofetch](https://github.com/unjs/ofetch) — HTTP 客户端（GitHub API / LLM API）
- [Zod](https://zod.dev) — 运行时参数校验

**前端**
- [Astro](https://astro.build) — SSR 框架（island 架构）
- [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com) — UI 组件与样式
- [React](https://react.dev) — 交互式 island 组件
