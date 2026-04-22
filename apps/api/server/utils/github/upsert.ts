import type { StarredRepo } from './types'

/**
 * Upsert a batch of starred repos into the stars table.
 * Uses raw SQL for performance (bulk insert with ON CONFLICT).
 */
export function upsertStars(repos: StarredRepo[]): number {
  const db = getDb()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO stars (
      id, full_name, owner, name, description, homepage, language, topics,
      stargazers_count, forks_count, is_archived, is_fork, html_url, starred_at, synced_at
    ) VALUES (
      @id, @fullName, @owner, @name, @description, @homepage, @language, @topics,
      @stargazersCount, @forksCount, @isArchived, @isFork, @htmlUrl, @starredAt, @syncedAt
    )
    ON CONFLICT(id) DO UPDATE SET
      full_name        = excluded.full_name,
      description      = excluded.description,
      homepage         = excluded.homepage,
      language         = excluded.language,
      topics           = excluded.topics,
      stargazers_count = excluded.stargazers_count,
      forks_count      = excluded.forks_count,
      is_archived      = excluded.is_archived,
      html_url         = excluded.html_url,
      starred_at       = excluded.starred_at,
      synced_at        = excluded.synced_at
  `)

  const insertMany = db.transaction((items: StarredRepo[]) => {
    for (const { repo, starred_at } of items) {
      stmt.run({
        id: repo.id,
        fullName: repo.full_name,
        owner: repo.owner.login,
        name: repo.name,
        description: repo.description ?? null,
        homepage: repo.homepage ?? null,
        language: repo.language ?? null,
        topics: JSON.stringify(repo.topics ?? []),
        stargazersCount: repo.stargazers_count,
        forksCount: repo.forks_count,
        isArchived: repo.archived ? 1 : 0,
        isFork: repo.fork ? 1 : 0,
        htmlUrl: repo.html_url,
        starredAt: starred_at,
        syncedAt: now,
      })
    }
    return items.length
  })

  return insertMany(repos) as number
}
