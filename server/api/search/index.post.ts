import { z } from 'zod'
import { keywordSearch } from '../../utils/search/keywordSearch'
import { vectorSearch } from '../../utils/search/vectorSearch'
import type { SearchResult } from '../../utils/search/keywordSearch'

const bodySchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(50).default(20),
  strategy: z.enum(['vector', 'keyword', 'hybrid']).default('hybrid'),
  vectorWeight: z.number().min(0).max(1).default(0.7),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.message })
  }

  const { query, limit, strategy, vectorWeight } = parsed.data
  const start = Date.now()

  let results: SearchResult[] = []

  if (strategy === 'keyword') {
    results = keywordSearch(query, limit)
  } else if (strategy === 'vector') {
    try {
      results = await vectorSearch(query, limit)
    } catch (err) {
      // Fallback to keyword if embeddings not configured/available
      console.warn('[search] Vector search failed, falling back to keyword:', (err as Error).message)
      results = keywordSearch(query, limit)
    }
  } else {
    // hybrid
    const [vectorResults, keywordResults] = await Promise.all([
      vectorSearch(query, limit).catch(() => [] as SearchResult[]),
      Promise.resolve(keywordSearch(query, limit)),
    ])

    results = mergeHybrid(vectorResults, keywordResults, vectorWeight, limit)
  }

  return {
    ok: true,
    data: results,
    meta: {
      query,
      strategy,
      total: results.length,
      took_ms: Date.now() - start,
    },
  }
})

function mergeHybrid(
  vectorResults: SearchResult[],
  keywordResults: SearchResult[],
  vectorWeight: number,
  limit: number
): SearchResult[] {
  const scores = new Map<number, { item: SearchResult; score: number }>()

  // Normalize vector scores to [0,1] (already done via 1/(1+dist))
  const maxVec = Math.max(...vectorResults.map(r => r.score), 1)
  for (const r of vectorResults) {
    const normalized = r.score / maxVec
    scores.set(r.id, { item: r, score: vectorWeight * normalized })
  }

  // Normalize keyword scores
  const maxKw = Math.max(...keywordResults.map(r => r.score), 1)
  for (const r of keywordResults) {
    const normalized = r.score / maxKw
    const existing = scores.get(r.id)
    if (existing) {
      existing.score += (1 - vectorWeight) * normalized
    } else {
      scores.set(r.id, { item: r, score: (1 - vectorWeight) * normalized })
    }
  }

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(e => ({ ...e.item, score: e.score }))
}
