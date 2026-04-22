export interface Star {
  id: number
  fullName: string
  owner: string
  name: string
  description: string | null
  homepage: string | null
  language: string | null
  topics: string[]
  stargazersCount: number
  forksCount: number
  isArchived: boolean
  isFork: boolean
  htmlUrl: string
  starredAt: string
  syncedAt: string
  aiSummary: string | null
  aiKeywords: string[] | null
  analysisModel: string | null
  analyzedAt: string | null
  // Only on detail endpoint
  embeddingModel?: string | null
  dimensions?: number | null
}

export interface SearchResult extends Star {
  score: number
}

export interface PaginatedStars {
  ok: boolean
  data: Star[]
  meta: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface SearchResponse {
  ok: boolean
  data: SearchResult[]
  meta: {
    query: string
    strategy: string
    total: number
    took_ms: number
  }
}

export interface HealthData {
  ok: boolean
  data: {
    status: string
    stars: {
      total: number
      analyzed: number
      pending: number
      embedded: number
    }
    lastSync: {
      syncType: string
      status: string
      reposSynced: number
      startedAt: string
      completedAt: string | null
    } | null
  }
}

export interface ConfigData {
  ok: boolean
  data: {
    github: {
      username: string | null
      token: string | null
      configured: boolean
    }
    llm: {
      provider: string
      baseUrl: string | null
      chatModel: string | null
      embeddingModel: string | null
      embeddingDimensions: number
      configured: boolean
    }
    db: { path: string }
    overrides: Record<string, string>
  }
}

export type SearchStrategy = 'hybrid' | 'keyword' | 'vector'
