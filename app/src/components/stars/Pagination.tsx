import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number
  pages: number
  total: number
}

export function Pagination({ page, pages, total }: Props) {
  function goTo(p: number) {
    const params = new URLSearchParams(window.location.search)
    params.set('page', String(p))
    window.location.search = params.toString()
  }

  if (pages <= 1) return null

  const start = Math.max(1, page - 2)
  const end = Math.min(pages, page + 2)
  const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-muted-foreground">
        {total.toLocaleString()} repositories
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {start > 1 && (
          <>
            <Button variant="outline" size="sm" onClick={() => goTo(1)}>1</Button>
            {start > 2 && <span className="px-1 text-muted-foreground text-sm">…</span>}
          </>
        )}
        {pageNumbers.map((p) => (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => goTo(p)}
          >
            {p}
          </Button>
        ))}
        {end < pages && (
          <>
            {end < pages - 1 && <span className="px-1 text-muted-foreground text-sm">…</span>}
            <Button variant="outline" size="sm" onClick={() => goTo(pages)}>{pages}</Button>
          </>
        )}
        <Button
          variant="outline"
          size="icon"
          disabled={page >= pages}
          onClick={() => goTo(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
