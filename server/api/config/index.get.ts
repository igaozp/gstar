export default defineEventHandler(() => {
  const config = useRuntimeConfig()

  return {
    ok: true,
    data: {
      github: {
        username: config.githubUsername || null,
        token: config.githubToken ? '***' : null,
        configured: !!(config.githubToken && config.githubUsername),
      },
      llm: {
        provider: config.llmProvider || 'openai',
        baseUrl: config.llmBaseUrl || null,
        chatModel: config.llmChatModel || null,
        embeddingModel: config.llmEmbeddingModel || null,
        embeddingDimensions: config.llmEmbeddingDimensions || 1536,
        configured: !!config.llmApiKey,
      },
      db: {
        path: config.dbPath || './data/gstar.db',
      },
      // Persisted overrides from app_config table
      overrides: getAllAppConfig(),
    },
  }
})
