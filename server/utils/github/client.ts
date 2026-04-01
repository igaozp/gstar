import { $fetch } from 'ofetch'
import type { StarredRepo } from './types'

const GH_API = 'https://api.github.com'

export interface FetchStarsOptions {
  token: string
  username: string
  /** Stop fetching when this starred_at timestamp is reached (exclusive). Used for incremental sync. */
  stopAfter?: string
  /** ETag from a previous full-page fetch — if server returns 304, yields nothing. */
  etag?: string
  onPage?: (page: number, count: number) => void
}

export interface FetchStarsResult {
  items: StarredRepo[]
  /** ETag from the first page response, for caching */
  etag: string | null
  /** Whether the server returned 304 Not Modified on the first page */
  notModified: boolean
}

/**
 * Async generator that yields pages of starred repos.
 * Stops early when a repo's starred_at is older than stopAfter.
 */
export async function* fetchStarredPages(opts: FetchStarsOptions): AsyncGenerator<StarredRepo[]> {
  const { token, username, stopAfter } = opts
  let page = 1
  let firstEtag: string | null = null

  while (true) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.star+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
    if (page === 1 && opts.etag) {
      headers['If-None-Match'] = opts.etag
    }

    let responseHeaders: Headers
    let data: StarredRepo[]

    try {
      const response = await $fetch.raw<StarredRepo[]>(
        `${GH_API}/users/${username}/starred`,
        {
          query: { per_page: 100, page, sort: 'created', direction: 'desc' },
          headers,
          onResponse({ response: r }) {
            responseHeaders = r.headers
          },
        }
      )

      if (response.status === 304) {
        return // Nothing changed
      }

      data = response._data ?? []
      if (page === 1) {
        firstEtag = responseHeaders!.get('etag')
      }
    } catch (err: unknown) {
      const fetchErr = err as { response?: { status?: number } }
      if (page === 1 && fetchErr?.response?.status === 304) {
        return
      }
      throw err
    }

    opts.onPage?.(page, data.length)

    if (data.length === 0) break

    if (stopAfter) {
      const filtered = data.filter(s => s.starred_at > stopAfter)
      if (filtered.length > 0) yield filtered
      if (filtered.length < data.length) break // hit the cursor boundary
    } else {
      yield data
    }

    if (data.length < 100) break // last page
    page++
  }

  // Expose etag via a special sentinel — callers can use fetchAllStars wrapper instead
  void firstEtag
}

export async function fetchAllStars(opts: FetchStarsOptions): Promise<FetchStarsResult> {
  const items: StarredRepo[] = []
  let etag: string | null = null
  let notModified = false

  const headers: Record<string, string> = {
    Authorization: `Bearer ${opts.token}`,
    Accept: 'application/vnd.github.star+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  let page = 1
  while (true) {
    const reqHeaders = { ...headers }
    if (page === 1 && opts.etag) {
      reqHeaders['If-None-Match'] = opts.etag
    }

    let status = 200
    let respEtag: string | null = null

    const data = await $fetch<StarredRepo[]>(
      `${GH_API}/users/${opts.username}/starred`,
      {
        query: {
          per_page: 100,
          page,
          sort: 'created',
          direction: 'desc',
        },
        headers: reqHeaders,
        ignoreResponseError: true,
        onResponse({ response }) {
          status = response.status
          if (page === 1) respEtag = response.headers.get('etag')
        },
      }
    )

    if (page === 1) {
      if (status === 304) {
        notModified = true
        break
      }
      etag = respEtag
    }

    if (!Array.isArray(data) || data.length === 0) break

    if (opts.stopAfter) {
      const filtered = data.filter(s => s.starred_at > opts.stopAfter!)
      items.push(...filtered)
      if (filtered.length < data.length) break
    } else {
      items.push(...data)
    }

    opts.onPage?.(page, data.length)

    if (data.length < 100) break
    page++
  }

  return { items, etag, notModified }
}
