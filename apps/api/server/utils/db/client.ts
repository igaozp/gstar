import type Database from 'better-sqlite3'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import type * as schema from './schema'

// Singleton instances set by the database plugin at startup
let _db: Database.Database | null = null
let _drizzle: BetterSQLite3Database<typeof schema> | null = null

export function setDb(db: Database.Database, drizzle: BetterSQLite3Database<typeof schema>) {
  _db = db
  _drizzle = drizzle
}

export function getDb(): Database.Database {
  if (!_db) throw new Error('Database not initialized. Is the database plugin loaded?')
  return _db
}

export function getDrizzle(): BetterSQLite3Database<typeof schema> {
  if (!_drizzle) throw new Error('Drizzle not initialized. Is the database plugin loaded?')
  return _drizzle
}
