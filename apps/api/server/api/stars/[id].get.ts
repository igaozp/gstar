export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const numId = parseInt(id ?? '')

  if (isNaN(numId)) {
    throw createError({ statusCode: 400, message: 'Invalid repo ID' })
  }

  const db = getDb()
  const row = db.prepare(`
    SELECT s.*, e.embedding_model, e.dimensions
    FROM stars s
    LEFT JOIN embeddings e ON e.repo_id = s.id
    WHERE s.id = ?
  `).get(numId) as Record<string, unknown> | undefined

  if (!row) {
    throw createError({ statusCode: 404, message: 'Repo not found' })
  }

  return {
    ok: true,
    data: {
      ...row,
      topics: tryParseJson(row.topics as string | null, []),
      aiKeywords: tryParseJson(row.ai_keywords as string | null, null),
    },
  }
})

function tryParseJson<T>(val: string | null, fallback: T): T {
  if (!val) return fallback
  try { return JSON.parse(val) } catch { return fallback }
}
