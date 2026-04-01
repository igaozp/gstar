import BetterSqlite3 from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import * as sqliteVec from 'sqlite-vec'
import * as schema from '../utils/db/schema'
import { setDb } from '../utils/db/client'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const dbPath = resolve(config.dbPath)

  // Ensure data directory exists
  mkdirSync(dirname(dbPath), { recursive: true })

  // Open database
  const sqlite = new BetterSqlite3(dbPath)

  // Enable WAL mode for better concurrent read performance
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  // Load sqlite-vec extension
  sqliteVec.load(sqlite)

  // Build drizzle instance
  const db = drizzle(sqlite, { schema })

  // Run Drizzle migrations
  try {
    migrate(db, { migrationsFolder: './server/utils/db/migrations' })
  } catch (e) {
    // Migrations folder may not exist yet on first run before drizzle-kit generate
    // In that case we rely on the manual table creation below
    console.warn('[db] Migration skipped (no migrations folder):', (e as Error).message)
  }

  // Create tables that Drizzle cannot manage (sqlite-vec virtual tables, FTS5)
  const embDims = config.llmEmbeddingDimensions || 1536

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS stars (
      id              INTEGER PRIMARY KEY,
      full_name       TEXT NOT NULL UNIQUE,
      owner           TEXT NOT NULL,
      name            TEXT NOT NULL,
      description     TEXT,
      homepage        TEXT,
      language        TEXT,
      topics          TEXT,
      stargazers_count INTEGER DEFAULT 0,
      forks_count     INTEGER DEFAULT 0,
      is_archived     INTEGER DEFAULT 0,
      is_fork         INTEGER DEFAULT 0,
      html_url        TEXT NOT NULL,
      starred_at      TEXT NOT NULL,
      synced_at       TEXT NOT NULL,
      ai_summary      TEXT,
      ai_keywords     TEXT,
      analysis_model  TEXT,
      analyzed_at     TEXT
    );

    CREATE TABLE IF NOT EXISTS embeddings (
      repo_id         INTEGER PRIMARY KEY REFERENCES stars(id) ON DELETE CASCADE,
      embedding_model TEXT NOT NULL,
      dimensions      INTEGER NOT NULL,
      created_at      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      sync_type       TEXT NOT NULL,
      status          TEXT NOT NULL,
      repos_found     INTEGER DEFAULT 0,
      repos_synced    INTEGER DEFAULT 0,
      last_starred_at TEXT,
      etag            TEXT,
      error_message   TEXT,
      started_at      TEXT NOT NULL,
      completed_at    TEXT
    );

    CREATE TABLE IF NOT EXISTS app_config (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  // sqlite-vec virtual table — dimensions must match embedding model
  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS vec_stars
    USING vec0(repo_id integer primary key, embedding float[${embDims}]);
  `)

  // FTS5 full-text search table
  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS stars_fts
    USING fts5(
      full_name,
      description,
      ai_summary,
      ai_keywords,
      language,
      topics,
      content=stars,
      content_rowid=id
    );
  `)

  // FTS5 triggers to keep index in sync
  sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS stars_ai AFTER INSERT ON stars BEGIN
      INSERT INTO stars_fts(rowid, full_name, description, ai_summary, ai_keywords, language, topics)
      VALUES (new.id, new.full_name, new.description, new.ai_summary, new.ai_keywords, new.language, new.topics);
    END;

    CREATE TRIGGER IF NOT EXISTS stars_ad AFTER DELETE ON stars BEGIN
      INSERT INTO stars_fts(stars_fts, rowid, full_name, description, ai_summary, ai_keywords, language, topics)
      VALUES ('delete', old.id, old.full_name, old.description, old.ai_summary, old.ai_keywords, old.language, old.topics);
    END;

    CREATE TRIGGER IF NOT EXISTS stars_au AFTER UPDATE ON stars BEGIN
      INSERT INTO stars_fts(stars_fts, rowid, full_name, description, ai_summary, ai_keywords, language, topics)
      VALUES ('delete', old.id, old.full_name, old.description, old.ai_summary, old.ai_keywords, old.language, old.topics);
      INSERT INTO stars_fts(rowid, full_name, description, ai_summary, ai_keywords, language, topics)
      VALUES (new.id, new.full_name, new.description, new.ai_summary, new.ai_keywords, new.language, new.topics);
    END;
  `)

  setDb(sqlite, db)
  console.log('[db] Database initialized:', dbPath)
})
