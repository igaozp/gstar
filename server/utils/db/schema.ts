import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// ── Core starred repository record ─────────────────────────────────────────
export const stars = sqliteTable('stars', {
  id:              integer('id').primaryKey(),            // GitHub repo ID (stable)
  fullName:        text('full_name').notNull().unique(),  // "owner/repo"
  owner:           text('owner').notNull(),
  name:            text('name').notNull(),
  description:     text('description'),
  homepage:        text('homepage'),
  language:        text('language'),
  topics:          text('topics'),                        // JSON array string
  stargazersCount: integer('stargazers_count').default(0),
  forksCount:      integer('forks_count').default(0),
  isArchived:      integer('is_archived', { mode: 'boolean' }).default(false),
  isFork:          integer('is_fork', { mode: 'boolean' }).default(false),
  htmlUrl:         text('html_url').notNull(),
  starredAt:       text('starred_at').notNull(),          // ISO8601 from GH API
  syncedAt:        text('synced_at').notNull(),
  // LLM-enriched fields
  aiSummary:       text('ai_summary'),
  aiKeywords:      text('ai_keywords'),                   // JSON string array
  analysisModel:   text('analysis_model'),
  analyzedAt:      text('analyzed_at'),                   // NULL = not yet analyzed
})

// ── Vector embeddings metadata (actual vectors live in sqlite-vec virtual table) ──
export const embeddings = sqliteTable('embeddings', {
  repoId:         integer('repo_id').primaryKey()
                    .references(() => stars.id, { onDelete: 'cascade' }),
  embeddingModel: text('embedding_model').notNull(),
  dimensions:     integer('dimensions').notNull(),
  createdAt:      text('created_at').notNull(),
})
// The actual float32 vectors live in a sqlite-vec virtual table created at startup:
//   CREATE VIRTUAL TABLE IF NOT EXISTS vec_stars USING vec0(repo_id integer primary key, embedding float[N])

// ── Sync state tracking ────────────────────────────────────────────────────
export const syncState = sqliteTable('sync_state', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  syncType:       text('sync_type').notNull(),            // 'full' | 'incremental'
  status:         text('status').notNull(),               // 'running' | 'completed' | 'failed'
  reposFound:     integer('repos_found').default(0),
  reposSynced:    integer('repos_synced').default(0),
  lastStarredAt:  text('last_starred_at'),                // cursor for incremental sync
  etag:           text('etag'),                           // GitHub ETag cache
  errorMessage:   text('error_message'),
  startedAt:      text('started_at').notNull(),
  completedAt:    text('completed_at'),
})

// ── App configuration ──────────────────────────────────────────────────────
export const appConfig = sqliteTable('app_config', {
  key:       text('key').primaryKey(),
  value:     text('value').notNull(),                     // JSON-serialized
  updatedAt: text('updated_at').notNull(),
})
