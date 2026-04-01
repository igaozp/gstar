export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  temperature?: number
  maxTokens?: number
}

export interface LLMClient {
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<string>
  embed(text: string): Promise<number[]>
  embedBatch(texts: string[]): Promise<number[][]>
}

export interface RepoAnalysis {
  summary: string
  keywords: string[]
}
