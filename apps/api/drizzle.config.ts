import { isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

const workspaceDir = fileURLToPath(new URL('./', import.meta.url))
const repoRoot = fileURLToPath(new URL('../../', import.meta.url))

loadEnv({ path: resolve(repoRoot, '.env'), quiet: true })
loadEnv({ path: resolve(workspaceDir, '.env'), override: true, quiet: true })

const dbPath = process.env.DB_PATH ?? './data/gstar.db'

export default defineConfig({
  schema: './server/utils/db/schema.ts',
  out: './server/utils/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: isAbsolute(dbPath) ? dbPath : resolve(repoRoot, dbPath),
  },
})
