import { useState, useCallback, useRef } from 'react'
import { ArrowUpRight, Loader2, Search, Sparkles } from 'lucide-react'
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
    <div className="space-y-10">
      <section className="grid gap-8 border border-border bg-card/80 p-6 shadow-sm lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 border border-border bg-background px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
            <Sparkles className="size-3.5" />
            Hybrid semantic retrieval
          </div>
          <div className="space-y-4">
            <h1 className="font-heading text-5xl font-semibold leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Search your starred universe.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              Query repository names, descriptions, AI summaries, keywords, and embeddings with one focused command surface.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="self-end border border-border bg-background p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-3">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Command</span>
            <span className="text-xs text-muted-foreground">⌘ search</span>
          </div>
          <div className="grid gap-4">
            <div className="relative">
              <Search className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={handleQueryChange}
                placeholder="machine learning, state management, HTTP client"
                className="h-14 border-b-foreground/20 pl-7 font-heading text-xl"
                autoFocus
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Select value={strategy} onValueChange={handleStrategyChange}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="vector">Semantic</SelectItem>
                  <SelectItem value="keyword">Keyword</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={loading || !query.trim()} className="h-11">
                {loading ? <Loader2 className="animate-spin" /> : <ArrowUpRight />}
                Search
              </Button>
            </div>
          </div>
        </form>
      </section>

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-border bg-card p-6 shadow-sm">
              <Skeleton className="mb-5 h-6 w-2/3" />
              <Skeleton className="mb-3 h-3 w-full" />
              <Skeleton className="mb-5 h-3 w-4/5" />
              <div className="flex gap-3 border-t border-border pt-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && meta && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Results</p>
              <h2 className="mt-2 font-heading text-3xl font-semibold">
                {meta.total} matches for “{meta.query}”
              </h2>
            </div>
            <p className="border border-border bg-card px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {meta.strategy} · {meta.took_ms}ms
            </p>
          </div>
          {results.length === 0 ? (
            <div className="border border-dashed border-border bg-card/70 p-12 text-center">
              <p className="font-heading text-2xl font-semibold">No signal found</p>
              <p className="mt-2 text-sm text-muted-foreground">Try a different query or switch to keyword search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
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
        <div className="grid gap-4 border border-dashed border-border bg-card/60 p-10 text-center text-muted-foreground sm:grid-cols-3 sm:text-left">
          <div>
            <p className="font-heading text-2xl text-foreground">01</p>
            <p className="mt-2 text-sm">Start with a fuzzy idea.</p>
          </div>
          <div>
            <p className="font-heading text-2xl text-foreground">02</p>
            <p className="mt-2 text-sm">Choose hybrid, semantic, or keyword mode.</p>
          </div>
          <div>
            <p className="font-heading text-2xl text-foreground">03</p>
            <p className="mt-2 text-sm">Open the strongest repository matches.</p>
          </div>
        </div>
      )}
    </div>
  )
}
