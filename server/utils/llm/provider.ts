import { OpenAIClient } from './openai'
import { AnthropicClient } from './anthropic'
import type { LLMClient } from './types'

let _client: LLMClient | null = null

export function getLLMClient(): LLMClient {
  if (_client) return _client

  const config = useRuntimeConfig()
  const provider = config.llmProvider || 'openai'

  if (provider === 'anthropic') {
    if (!config.llmEmbeddingApiKey || !config.llmEmbeddingBaseUrl) {
      throw new Error(
        'Anthropic provider requires LLM_EMBEDDING_API_KEY and LLM_EMBEDDING_BASE_URL ' +
        '(Anthropic has no embedding API — configure a separate OpenAI-compatible endpoint)'
      )
    }
    _client = new AnthropicClient({
      apiKey: config.llmApiKey,
      baseUrl: config.llmBaseUrl || undefined,
      chatModel: config.llmChatModel,
      embeddingApiKey: config.llmEmbeddingApiKey,
      embeddingBaseUrl: config.llmEmbeddingBaseUrl,
      embeddingModel: config.llmEmbeddingModel,
    })
  } else {
    // 'openai' or 'openai_compatible'
    _client = new OpenAIClient({
      apiKey: config.llmApiKey,
      baseUrl: config.llmBaseUrl || undefined,
      chatModel: config.llmChatModel,
      embeddingModel: config.llmEmbeddingModel,
    })
  }

  return _client
}

/** Reset the cached client (useful when config changes at runtime) */
export function resetLLMClient() {
  _client = null
}
