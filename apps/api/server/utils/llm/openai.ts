import { $fetch } from 'ofetch'
import type { ChatMessage, ChatOptions, LLMClient } from './types'

export class OpenAIClient implements LLMClient {
  private chatBase: string
  private embedBase: string
  private chatApiKey: string
  private embedApiKey: string
  private temperature: number
  private maxTokens: number
  readonly chatModel: string
  readonly embeddingModel: string

  constructor(opts: {
    apiKey: string
    baseUrl?: string
    chatModel: string
    embeddingModel: string
    // For Anthropic: a separate embedding endpoint
    embeddingApiKey?: string
    embeddingBaseUrl?: string
    temperature?: number
    maxTokens?: number
  }) {
    const base = opts.baseUrl?.replace(/\/$/, '') || 'https://api.openai.com/v1'
    this.chatBase = base
    this.embedBase = (opts.embeddingBaseUrl?.replace(/\/$/, '') || base)
    this.chatApiKey = opts.apiKey
    this.embedApiKey = opts.embeddingApiKey || opts.apiKey
    this.temperature = opts.temperature ?? 0.3
    this.maxTokens = opts.maxTokens ?? 1024
    this.chatModel = opts.chatModel
    this.embeddingModel = opts.embeddingModel
  }

  async chat(messages: ChatMessage[], opts?: ChatOptions): Promise<string> {
    const response = await $fetch<{ choices: Array<{ message: { content: string } }> }>(
      `${this.chatBase}/chat/completions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.chatApiKey}`,
          'Content-Type': 'application/json',
        },
        body: {
          model: this.chatModel,
          messages,
          temperature: opts?.temperature ?? this.temperature,
          max_tokens: opts?.maxTokens ?? this.maxTokens,
        },
      }
    )
    return response.choices[0]?.message?.content ?? ''
  }

  async embed(text: string): Promise<number[]> {
    const [result] = await this.embedBatch([text])
    return result
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await $fetch<{ data: Array<{ embedding: number[] }> }>(
      `${this.embedBase}/embeddings`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.embedApiKey}`,
          'Content-Type': 'application/json',
        },
        body: {
          model: this.embeddingModel,
          input: texts,
        },
      }
    )
    return response.data.map(d => d.embedding)
  }
}
