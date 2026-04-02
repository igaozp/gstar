# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (root)

```bash
npm run dev          # Start Nitro dev server (hot reload) on http://localhost:3000
npm run build        # Production build → .output/
npm run start        # Run production build

npm run db:generate  # Generate Drizzle migration files from schema changes
npm run db:push      # Push schema directly to DB (no migration file, dev only)
npm run db:studio    # Open Drizzle Studio browser UI

npm run app:dev      # Shortcut: start Astro frontend (runs npm --prefix app run dev)
npm run app:build    # Shortcut: build Astro frontend
```

### Frontend (app/)

```bash
cd app
npm run dev          # Start Astro dev server on http://localhost:4321
npm run build        # Production build
```

There are no tests. No linter is configured.

## Architecture

This repo has two components:
- **Backend** — a Nitro server (`srcDir: 'server'`) that manages GitHub starred repositories. Everything lives under `server/`.
- **Frontend** — an Astro SSR app under `app/` that consumes the backend REST API.

### Data flow

1. **Sync** — GitHub API → `stars` table (via `server/utils/github/`)
2. **Analyze** — `stars` rows where `analyzed_at IS NULL` → LLM → `ai_summary` + `ai_keywords` + embedding in `vec_stars`
3. **Search** — user query → FTS5 and/or sqlite-vec → ranked results

### Key architectural decisions

**Database:** `better-sqlite3` (synchronous) + `sqlite-vec` extension for vector search. The `vec_stars` virtual table and `stars_fts` FTS5 table are created by raw SQL in `server/plugins/database.ts` at startup — Drizzle cannot model virtual tables. Regular tables are managed by Drizzle (`server/utils/db/schema.ts`). The DB singleton is set in `server/utils/db/client.ts` via `setDb()` and accessed anywhere via `getDb()` / `getDrizzle()` (Nitro auto-imports everything in `server/utils/`).

**LLM providers:** Three providers (`openai`, `anthropic`, `openai_compatible`) all implement the `LLMClient` interface (`server/utils/llm/types.ts`). Anthropic has no embedding API — it delegates embedding to a separately configured OpenAI-compatible endpoint. The factory in `server/utils/llm/provider.ts` is a singleton; call `resetLLMClient()` after changing config.

**Vectors:** Embeddings are normalized to unit length before storage so L2 distance equals cosine distance. The actual `float[]` buffer is stored in the `vec_stars` sqlite-vec virtual table; the `embeddings` table stores only metadata (model name, dimensions).

**Search strategies:** `keyword` uses FTS5 (always available, no LLM needed), `vector` queries sqlite-vec (requires embeddings), `hybrid` merges both with configurable `vectorWeight` (default 0.7). The search endpoint (`server/api/search/index.post.ts`) falls back to keyword if vector fails.

**Scheduled tasks:** `sync:incremental` runs hourly; `analyze:pending` runs every 5 minutes. Both can also be triggered via `POST /api/stars/sync`. Tasks are in `server/tasks/`.

### Incremental sync cursor

The `sync_state` table tracks `last_starred_at` (ISO8601 timestamp). Incremental sync passes this as `stopAfter` to `fetchAllStars()`, which stops pagination early once it encounters older entries. An ETag fast-path handles the "zero new stars" case (GitHub returns 304).

### Embedding dimensions

The `vec_stars` virtual table is created with dimensions from `LLM_EMBEDDING_DIMENSIONS` (default 1536). Changing the embedding model to one with different dimensions requires dropping and recreating the `vec_stars` table and re-running `analyze:pending` for all repos.

## Frontend Architecture (app/)

The frontend is an **Astro SSR app** (`output: 'server'`) with React islands and shadcn/ui components.

- **Pages:** `src/pages/index.astro` (search), `src/pages/stars/index.astro` (browse), `src/pages/stars/[id].astro` (detail), `src/pages/settings.astro`
- **API client:** `src/lib/api.ts` — dual-context: uses `NITRO_BASE_URL` env var on the SSR server, relative `/api/*` path in the browser (proxied by Vite to `:3000` in dev)
- **Islands:** `SearchPage.tsx` (search form + results), `StarFilters.tsx` (language/analyzed dropdowns), `Pagination.tsx`, `SyncButton.tsx`
- **Shared types:** `src/lib/types.ts` mirrors the Nitro response shapes

In dev, the Vite proxy (`astro.config.mjs`) forwards all `/api/*` browser requests to `http://localhost:3000`. Copy `app/.env.example` to `app/.env` for the SSR server-side `NITRO_BASE_URL`.

## Configuration

Copy `.env.example` to `.env`. All config is read from `useRuntimeConfig()`. The `app_config` table can persist runtime overrides (via `PUT /api/config`); after updating LLM config, the `LLMClient` singleton is reset automatically.

For Ollama local usage, set `LLM_PROVIDER=openai_compatible`, `LLM_BASE_URL=http://localhost:11434/v1`, and choose models that support both chat and embeddings (e.g. `llama3.2` + `nomic-embed-text`).
