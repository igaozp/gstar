import { fetchAllStars } from '../../utils/github/client'
import { upsertStars } from '../../utils/github/upsert'

interface IncrementalSyncResult {
  synced: number
  notModified?: boolean
}

export default defineTask<IncrementalSyncResult>({
  meta: {
    name: 'sync:incremental',
    description: 'Incremental sync of newly starred GitHub repositories',
  },
  async run() {
    const config = getEffectiveAppConfig()

    if (!config.githubToken || !config.githubUsername) {
      throw new Error('GITHUB_TOKEN and GITHUB_USERNAME must be configured')
    }

    const db = getDb()
    const now = new Date().toISOString()

    // Get last successful sync cursor
    const lastSync = db.prepare(`
      SELECT last_starred_at, etag FROM sync_state
      WHERE status = 'completed'
      ORDER BY completed_at DESC
      LIMIT 1
    `).get() as { last_starred_at: string | null; etag: string | null } | undefined

    const syncId: number = (db.prepare(
      `INSERT INTO sync_state (sync_type, status, started_at) VALUES ('incremental', 'running', ?) RETURNING id`
    ).get(now) as { id: number }).id

    let reposSynced = 0

    try {
      console.log('[sync:incremental] Starting incremental sync, cursor:', lastSync?.last_starred_at ?? 'none')

      const result = await fetchAllStars({
        token: config.githubToken,
        username: config.githubUsername,
        stopAfter: lastSync?.last_starred_at ?? undefined,
        etag: lastSync?.etag ?? undefined,
      })

      if (result.notModified) {
        console.log('[sync:incremental] No changes (304 Not Modified)')
        db.prepare(`
          UPDATE sync_state SET status = 'completed', repos_synced = 0, completed_at = ? WHERE id = ?
        `).run(new Date().toISOString(), syncId)
        return { result: { synced: 0, notModified: true } }
      }

      if (result.items.length > 0) {
        reposSynced = upsertStars(result.items)

        // Update cursor to the most recent starred_at
        const newLatest = result.items[0]?.starred_at ?? null

        db.prepare(`
          UPDATE sync_state
          SET status = 'completed', repos_found = ?, repos_synced = ?,
              last_starred_at = ?, etag = ?, completed_at = ?
          WHERE id = ?
        `).run(result.items.length, reposSynced, newLatest, result.etag, new Date().toISOString(), syncId)
      } else {
        db.prepare(`
          UPDATE sync_state SET status = 'completed', repos_synced = 0, completed_at = ? WHERE id = ?
        `).run(new Date().toISOString(), syncId)
      }

      console.log(`[sync:incremental] Done. Synced ${reposSynced} new repos.`)
      return { result: { synced: reposSynced } }
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
