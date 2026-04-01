export interface SearchResult {
  id: number
  fullName: string
  description: string | null
  language: string | null
  topics: string[]
  aiSummary: string | null
  aiKeywords: string[] | null
  htmlUrl: string
  starredAt: string
  score: number
}

export function keywordSearch(query: string, limit: number): SearchResult[] {
  const db = getDb()

  // Use FTS5 match syntax, escape special characters
  const ftsQuery = query.trim().replace(/['"*^()]/g, ' ').trim()
  if (!ftsQuery) return []

  const rows = db.prepare(`
    SELECT
      s.id,
      s.full_name,
      s.description,
      s.language,
      s.topics,
      s.ai_summary,
      s.ai_keywords,
      s.html_url,
      s.starred_at,
      -rank AS score
    FROM stars_fts
    JOIN stars s ON s.id = stars_fts.rowid
    WHERE stars_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `).all(ftsQuery, limit) as Array<Record<string, unknown>>

  return rows.map(r => ({
    id: r.id as number,
    fullName: r.full_name as string,
    description: r.description as string | null,
    language: r.language as string | null,
    topics: tryParseJson(r.topics as string | null, []),
    aiSummary: r.ai_summary as string | null,
    aiKeywords: tryParseJson(r.ai_keywords as string | null, null),
    htmlUrl: r.html_url as string,
    starredAt: r.starred_at as string,
    score: r.score as number,
  }))
}

function tryParseJson<T>(val: string | null, fallback: T): T {
  if (!val) return fallback
  try { return JSON.parse(val) } catch { return fallback }
}
