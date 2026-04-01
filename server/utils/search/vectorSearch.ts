import type { SearchResult } from './keywordSearch'
import { normalizeVector } from './embed'

export async function vectorSearch(query: string, limit: number): Promise<SearchResult[]> {
  const db = getDb()

  // Check if vec_stars has any rows
  const count = (db.prepare('SELECT COUNT(*) as n FROM embeddings').get() as { n: number }).n
  if (count === 0) return []

  const llm = getLLMClient()
  const rawVector = await llm.embed(query)
  const vector = normalizeVector(rawVector)

  // sqlite-vec KNN query
  const rows = db.prepare(`
    SELECT
      v.repo_id,
      v.distance,
      s.full_name,
      s.description,
      s.language,
      s.topics,
      s.ai_summary,
      s.ai_keywords,
      s.html_url,
      s.starred_at
    FROM vec_stars v
    JOIN stars s ON s.id = v.repo_id
    WHERE v.embedding MATCH ?
      AND k = ?
    ORDER BY v.distance
  `).all(new Float32Array(vector).buffer, limit) as Array<Record<string, unknown>>

  return rows.map(r => ({
    id: r.repo_id as number,
    fullName: r.full_name as string,
    description: r.description as string | null,
    language: r.language as string | null,
    topics: tryParseJson(r.topics as string | null, []),
    aiSummary: r.ai_summary as string | null,
    aiKeywords: tryParseJson(r.ai_keywords as string | null, null),
    htmlUrl: r.html_url as string,
    starredAt: r.starred_at as string,
    // Convert L2 distance to similarity score (lower distance = higher score)
    score: 1 / (1 + (r.distance as number)),
  }))
}

function tryParseJson<T>(val: string | null, fallback: T): T {
  if (!val) return fallback
  try { return JSON.parse(val) } catch { return fallback }
}
