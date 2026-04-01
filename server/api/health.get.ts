export default defineEventHandler(() => {
  const db = getDb()

  const totalStars = (db.prepare('SELECT COUNT(*) as n FROM stars').get() as { n: number }).n
  const analyzedStars = (db.prepare('SELECT COUNT(*) as n FROM stars WHERE analyzed_at IS NOT NULL').get() as { n: number }).n
  const embeddedStars = (db.prepare('SELECT COUNT(*) as n FROM embeddings').get() as { n: number }).n

  const lastSync = db.prepare(`
    SELECT sync_type, status, repos_synced, started_at, completed_at
    FROM sync_state
    ORDER BY started_at DESC
    LIMIT 1
  `).get() as Record<string, unknown> | undefined

  return {
    ok: true,
    data: {
      status: 'ok',
      stars: {
        total: totalStars,
        analyzed: analyzedStars,
        pending: totalStars - analyzedStars,
        embedded: embeddedStars,
      },
      lastSync: lastSync ?? null,
    },
  }
})
