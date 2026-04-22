import { useState, useCallback, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StarCard } from '@/components/stars/StarCard'
import { api } from '@/lib/api'
import type { SearchResult, SearchStrategy } from '@/lib/types'

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [strategy, setStrategy] = useState<SearchStrategy>('hybrid')
  const [results, setResults] = useState<SearchResult[]>([])
  const [meta, setMeta] = useState<{ total: number; took_ms: number; query: string; strategy: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (q: string, s: SearchStrategy) => {
    if (!q.trim()) {
      setResults([])
      setMeta(null)
      setHasSearched(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.search({ query: q, strategy: s, limit: 30 })
      setResults(res.data)
      setMeta(res.meta)
      setHasSearched(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(q, strategy), 400)
  }

  function handleStrategyChange(s: string) {
    const newStrategy = s as SearchStrategy
    setStrategy(newStrategy)
    if (query.trim()) doSearch(query, newStrategy)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    doSearch(query, strategy)
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 pt-8">
        <h1 className="text-3xl font-bold tracking-tight">Search your stars</h1>
        <p className="text-muted-foreground">
          Search across {' '}
          <span className="font-medium">descriptions, AI summaries, and keywords</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={handleQueryChange}
            placeholder="e.g. machine learning, state management, HTTP client…"
            className="pl-9"
            autoFocus
          />
        </div>
        <Select value={strategy} onValueChange={handleStrategyChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hybrid">Hybrid</SelectItem>
            <SelectItem value="vector">Semantic</SelectItem>
            <SelectItem value="keyword">Keyword</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="animate-spin" /> : 'Search'}
        </Button>
      </form>

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6 space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && meta && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {meta.total} results for <span className="font-medium">"{meta.query}"</span>
            {' '}· {meta.took_ms}ms · {meta.strategy}
          </p>
          {results.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              No results found. Try a different query or switch to keyword search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.map((star) => (
                <StarCard
                  key={star.id}
                  star={star}
                  score={star.score}
                  href={`/stars/${star.id}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && !hasSearched && !error && (
        <div className="text-center text-muted-foreground text-sm py-12">
          Start typing to search your starred repositories
        </div>
      )}
    </div>
  )
}
