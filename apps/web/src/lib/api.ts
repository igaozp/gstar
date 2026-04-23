import type {
  PaginatedStars,
  SearchResponse,
  HealthData,
  ConfigData,
  Star,
  SearchStrategy,
} from './types'

function getBase(): string {
  if (typeof window === 'undefined') {
    return import.meta.env.NITRO_BASE_URL ?? 'http://localhost:3000'
  }
  return ''
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getBase()}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  health: () => apiFetch<HealthData>('/api/health'),

  stars: (params: {
    page?: number
    limit?: number
    language?: string
    topic?: string
    analyzed?: 'true' | 'false'
  } = {}) => {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) qs.set(k, String(v))
    }
    const query = qs.toString()
    return apiFetch<PaginatedStars>(`/api/stars${query ? `?${query}` : ''}`)
  },

  star: (id: number | string) =>
    apiFetch<{ ok: boolean; data: Star }>(`/api/stars/${id}`),

  search: (body: {
    query: string
    limit?: number
    strategy?: SearchStrategy
    vectorWeight?: number
  }) =>
    apiFetch<SearchResponse>('/api/search', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  sync: (type: 'full' | 'incremental') =>
    apiFetch<{ ok: boolean; data: unknown }>('/api/stars/sync', {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),

  config: () => apiFetch<ConfigData>('/api/config'),

  updateConfig: (body: Record<string, unknown>) =>
    apiFetch<ConfigData>('/api/config', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
}
