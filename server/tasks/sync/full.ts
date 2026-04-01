import { fetchAllStars } from '../../utils/github/client'
import { upsertStars } from '../../utils/github/upsert'

export default defineTask({
  meta: {
    name: 'sync:full',
    description: 'Full sync of all GitHub starred repositories',
  },
  async run() {
    const config = useRuntimeConfig()

    if (!config.githubToken || !config.githubUsername) {
      throw new Error('GITHUB_TOKEN and GITHUB_USERNAME must be configured')
    }

    const db = getDb()
    const now = new Date().toISOString()

    // Create sync state record
    const syncId: number = (db.prepare(
      `INSERT INTO sync_state (sync_type, status, started_at) VALUES ('full', 'running', ?) RETURNING id`
    ).get(now) as { id: number }).id

    let reposFound = 0
    let reposSynced = 0

    try {
      console.log('[sync:full] Starting full sync for', config.githubUsername)

      const result = await fetchAllStars({
        token: config.githubToken,
        username: config.githubUsername,
        onPage: (page, count) => {
          reposFound += count
          console.log(`[sync:full] Page ${page}: ${count} repos (total: ${reposFound})`)
        },
      })

      // Upsert all repos in one pass
      reposSynced = upsertStars(result.items)

      // Find most recent starred_at
      const latestRow = db.prepare(
        `SELECT MAX(starred_at) as latest FROM stars`
      ).get() as { latest: string | null }

      db.prepare(`
        UPDATE sync_state
        SET status = 'completed', repos_found = ?, repos_synced = ?,
            last_starred_at = ?, etag = ?, completed_at = ?
        WHERE id = ?
      `).run(reposFound, reposSynced, latestRow.latest, result.etag, new Date().toISOString(), syncId)

      console.log(`[sync:full] Done. Synced ${reposSynced} repos.`)
      return { result: { synced: reposSynced, total: reposFound } }
    } catch (err) {
      db.prepare(`
        UPDATE sync_state
        SET status = 'failed', error_message = ?, completed_at = ?
        WHERE id = ?
      `).run((err as Error).message, new Date().toISOString(), syncId)
      throw err
    }
  },
})
