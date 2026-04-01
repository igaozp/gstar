import { z } from 'zod'

const querySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
  language: z.string().optional(),
  topic:    z.string().optional(),
  analyzed: z.enum(['true', 'false']).optional(),
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const parsed = querySchema.safeParse(query)

  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.message })
  }

  const { page, limit, language, topic, analyzed } = parsed.data
  const offset = (page - 1) * limit
  const db = getDb()

  let where = 'WHERE 1=1'
  const params: unknown[] = []

  if (language) {
    where += ' AND language = ?'
    params.push(language)
  }
  if (topic) {
    where += " AND topics LIKE ?"
    params.push(`%"${topic}"%`)
  }
  if (analyzed === 'true') {
    where += ' AND analyzed_at IS NOT NULL'
  } else if (analyzed === 'false') {
    where += ' AND analyzed_at IS NULL'
  }

  const total: number = (db.prepare(`SELECT COUNT(*) as n FROM stars ${where}`).get(...params) as { n: number }).n
  const rows = db.prepare(`
    SELECT id, full_name, owner, name, description, language, topics,
           stargazers_count, forks_count, html_url, starred_at, analyzed_at,
           ai_summary, ai_keywords
    FROM stars ${where}
    ORDER BY starred_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset)

  return {
    ok: true,
    data: rows.map(formatStar),
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  }
})

function formatStar(row: Record<string, unknown>) {
  return {
    ...row,
    topics: tryParseJson(row.topics as string | null, []),
    aiKeywords: tryParseJson(row.ai_keywords as string | null, null),
  }
}

function tryParseJson<T>(val: string | null, fallback: T): T {
  if (!val) return fallback
  try { return JSON.parse(val) } catch { return fallback }
}
