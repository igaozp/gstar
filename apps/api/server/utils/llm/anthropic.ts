import { $fetch } from 'ofetch'
import type { ChatMessage, ChatOptions, LLMClient } from './types'
import { OpenAIClient } from './openai'

/**
 * Anthropic adapter for chat.
 * Embedding is delegated to an OpenAI-compatible endpoint (Anthropic has no embedding API).
 */
export class AnthropicClient implements LLMClient {
  private base: string
  private apiKey: string
  private chatModel: string
  private embeddingDelegate: OpenAIClient

  constructor(opts: {
    apiKey: string
    baseUrl?: string
    chatModel: string
    embeddingApiKey: string
    embeddingBaseUrl: string
    embeddingModel: string
  }) {
    this.base = opts.baseUrl?.replace(/\/$/, '') || 'https://api.anthropic.com'
    this.apiKey = opts.apiKey
    this.chatModel = opts.chatModel
    this.embeddingDelegate = new OpenAIClient({
      apiKey: opts.embeddingApiKey,
      baseUrl: opts.embeddingBaseUrl,
      chatModel: '',
      embeddingModel: opts.embeddingModel,
    })
  }

  async chat(messages: ChatMessage[], opts?: ChatOptions): Promise<string> {
    // Anthropic requires system message to be separate
    const systemMsg = messages.find(m => m.role === 'system')
    const userMessages = messages.filter(m => m.role !== 'system')

    const body: Record<string, unknown> = {
      model: this.chatModel,
      max_tokens: opts?.maxTokens ?? 1024,
      messages: userMessages.map(m => ({ role: m.role, content: m.content })),
    }
    if (systemMsg) body.system = systemMsg.content

    const response = await $fetch<{ content: Array<{ type: string; text: string }> }>(
      `${this.base}/v1/messages`,
      {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body,
      }
    )
    return response.content.find(c => c.type === 'text')?.text ?? ''
  }

  async embed(text: string): Promise<number[]> {
    return this.embeddingDelegate.embed(text)
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return this.embeddingDelegate.embedBatch(texts)
  }
}
