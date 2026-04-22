import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'
import { defineNitroConfig } from 'nitropack/config'

const workspaceDir = fileURLToPath(new URL('./', import.meta.url))
const repoRoot = fileURLToPath(new URL('../../', import.meta.url))

loadEnv({ path: resolve(repoRoot, '.env'), quiet: true })
loadEnv({ path: resolve(workspaceDir, '.env'), override: true, quiet: true })

export default defineNitroConfig({
  srcDir: 'server',
  compatibilityDate: '2026-04-01',

  experimental: {
    tasks: true,
  },

  scheduledTasks: {
    // Incremental sync every hour
    '0 * * * *': ['sync:incremental'],
    // Analyze pending repos every 5 minutes
    '*/5 * * * *': ['analyze:pending'],
  },

  runtimeConfig: {
    githubToken: process.env.GITHUB_TOKEN ?? '',
    githubUsername: process.env.GITHUB_USERNAME ?? '',
    llmProvider: process.env.LLM_PROVIDER ?? 'openai',
    llmApiKey: process.env.LLM_API_KEY ?? '',
    llmBaseUrl: process.env.LLM_BASE_URL ?? '',
    llmChatModel: process.env.LLM_CHAT_MODEL ?? 'gpt-4o-mini',
    llmEmbeddingModel: process.env.LLM_EMBEDDING_MODEL ?? 'text-embedding-3-small',
    llmEmbeddingDimensions: parseInt(process.env.LLM_EMBEDDING_DIMENSIONS ?? '1536'),
    // For Anthropic: separate embedding endpoint
    llmEmbeddingApiKey: process.env.LLM_EMBEDDING_API_KEY ?? '',
    llmEmbeddingBaseUrl: process.env.LLM_EMBEDDING_BASE_URL ?? '',
    dbPath: process.env.DB_PATH ?? './data/gstar.db',
  },
})
