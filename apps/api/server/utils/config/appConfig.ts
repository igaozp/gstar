/**
 * Read/write app-level config from the app_config table.
 * These values overlay the environment variable defaults.
 */
export function getAppConfig(key: string): string | null {
  const db = getDb()
  const row = db.prepare('SELECT value FROM app_config WHERE key = ?').get(key) as { value: string } | undefined
  return row ? row.value : null
}

export function setAppConfig(key: string, value: unknown): void {
  const db = getDb()
  db.prepare(`
    INSERT INTO app_config (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, JSON.stringify(value), new Date().toISOString())
}

export function getAllAppConfig(): Record<string, unknown> {
  const db = getDb()
  const rows = db.prepare('SELECT key, value FROM app_config').all() as Array<{ key: string; value: string }>
  return Object.fromEntries(rows.map(r => [r.key, tryParseJson(r.value)]))
}

function tryParseJson(val: string): unknown {
  try { return JSON.parse(val) } catch { return val }
}
