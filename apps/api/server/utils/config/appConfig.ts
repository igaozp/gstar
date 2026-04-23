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

export interface EffectiveAppConfig {
  githubToken: string
  githubUsername: string
  llmProvider: string
  llmApiKey: string
  llmBaseUrl: string
  llmChatModel: string
  llmTemperature: number
  llmMaxTokens: number
  llmEmbeddingModel: string
  llmEmbeddingDimensions: number
  llmEmbeddingApiKey: string
  llmEmbeddingBaseUrl: string
  dbPath: string
}

export function getEffectiveAppConfig(): EffectiveAppConfig {
  const runtime = useRuntimeConfig()
  const overrides = getAllAppConfig()

  return {
    githubToken: stringValue(overrides.githubToken, runtime.githubToken),
    githubUsername: stringValue(overrides.githubUsername, runtime.githubUsername),
    llmProvider: stringValue(overrides.llmProvider, runtime.llmProvider || 'openai'),
    llmApiKey: stringValue(overrides.llmApiKey, runtime.llmApiKey),
    llmBaseUrl: stringValue(overrides.llmBaseUrl, runtime.llmBaseUrl),
    llmChatModel: stringValue(overrides.llmChatModel, runtime.llmChatModel || 'gpt-4o-mini'),
    llmTemperature: numberValue(overrides.llmTemperature, runtime.llmTemperature, 0.3),
    llmMaxTokens: integerValue(overrides.llmMaxTokens, runtime.llmMaxTokens, 1024),
    llmEmbeddingModel: stringValue(overrides.llmEmbeddingModel, runtime.llmEmbeddingModel || 'text-embedding-3-small'),
    llmEmbeddingDimensions: integerValue(overrides.llmEmbeddingDimensions, runtime.llmEmbeddingDimensions, 1536),
    llmEmbeddingApiKey: stringValue(overrides.llmEmbeddingApiKey, runtime.llmEmbeddingApiKey),
    llmEmbeddingBaseUrl: stringValue(overrides.llmEmbeddingBaseUrl, runtime.llmEmbeddingBaseUrl),
    dbPath: stringValue(overrides.dbPath, runtime.dbPath || './data/gstar.db'),
  }
}

export function getPublicAppConfig() {
  const config = getEffectiveAppConfig()

  return {
    github: {
      username: config.githubUsername || null,
      token: config.githubToken ? '***' : null,
      configured: !!(config.githubToken && config.githubUsername),
    },
    llm: {
      provider: config.llmProvider,
      baseUrl: config.llmBaseUrl || null,
      chatModel: config.llmChatModel || null,
      temperature: config.llmTemperature,
      maxTokens: config.llmMaxTokens,
      embeddingModel: config.llmEmbeddingModel || null,
      embeddingDimensions: config.llmEmbeddingDimensions,
      embeddingBaseUrl: config.llmEmbeddingBaseUrl || null,
      apiKey: config.llmApiKey ? '***' : null,
      embeddingApiKey: config.llmEmbeddingApiKey ? '***' : null,
      configured: !!config.llmApiKey,
    },
    db: {
      path: config.dbPath || './data/gstar.db',
    },
  }
}

export function getSanitizedAppConfigOverrides(): Record<string, unknown> {
  const overrides = getAllAppConfig()
  const secretKeys = new Set(['githubToken', 'llmApiKey', 'llmEmbeddingApiKey'])

  return Object.fromEntries(
    Object.entries(overrides).map(([key, value]) => [
      key,
      secretKeys.has(key) && value ? '***' : value,
    ])
  )
}

function tryParseJson(val: string): unknown {
  try { return JSON.parse(val) } catch { return val }
}

function stringValue(value: unknown, fallback: unknown): string {
  const resolved = value ?? fallback ?? ''
  return typeof resolved === 'string' ? resolved.trim() : String(resolved).trim()
}

function numberValue(value: unknown, fallback: unknown, defaultValue: number): number {
  const resolved = value ?? fallback
  const parsed = typeof resolved === 'number' ? resolved : Number(resolved)
  return Number.isFinite(parsed) ? parsed : defaultValue
}

function integerValue(value: unknown, fallback: unknown, defaultValue: number): number {
  return Math.trunc(numberValue(value, fallback, defaultValue))
}
