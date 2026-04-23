import { ArrowUpRight, Cpu, ExternalLink, GitFork, Star } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Star as StarType } from '@/lib/types'

interface Props {
  star: StarType
  score?: number
  href?: string
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Python: 'bg-green-500',
  Go: 'bg-cyan-400',
  Rust: 'bg-orange-500',
  Java: 'bg-red-500',
  'C++': 'bg-pink-500',
  C: 'bg-gray-500',
  Ruby: 'bg-red-400',
  Swift: 'bg-orange-400',
  Kotlin: 'bg-purple-500',
  Shell: 'bg-green-400',
  HTML: 'bg-orange-600',
  CSS: 'bg-blue-400',
  Vue: 'bg-emerald-500',
}

function CardBody({ star, score, href }: Props) {
  return (
    <Card className="h-full border border-border bg-card/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-heading text-xl font-semibold tracking-wide">{star.fullName}</p>
              {star.isArchived && <Badge variant="outline">archived</Badge>}
            </div>
            {star.description && (
              <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{star.description}</p>
            )}
          </div>
          {score !== undefined && (
            <span className="shrink-0 border border-border bg-background px-2 py-1 font-mono text-xs text-muted-foreground">
              {(score * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {star.aiSummary && (
          <p className="line-clamp-3 border-l border-foreground/20 pl-4 text-sm leading-6 text-muted-foreground">
            {star.aiSummary}
          </p>
        )}

        <div className="flex flex-wrap gap-x-3 gap-y-2">
          {star.aiKeywords?.slice(0, 5).map((kw) => (
            <Badge key={kw} variant="outline">
              {kw}
            </Badge>
          ))}
          {star.topics?.slice(0, 3).map((topic) => (
            <Badge key={topic} variant="secondary">
              {topic}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {star.language && (
            <span className="flex items-center gap-2">
              <span className={cn('size-2.5', LANGUAGE_COLORS[star.language] ?? 'bg-gray-400')} />
              {star.language}
            </span>
          )}
          <span className="flex items-center gap-1.5"><Star className="size-3.5" />{star.stargazersCount.toLocaleString()}</span>
          <span className="flex items-center gap-1.5"><GitFork className="size-3.5" />{star.forksCount.toLocaleString()}</span>
          {star.analyzedAt && <span className="flex items-center gap-1.5"><Cpu className="size-3.5" />analyzed</span>}
        </div>
        <div className="flex items-center gap-3">
          {href && (
            <a href={href} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-foreground hover:text-muted-foreground">
              Details <ArrowUpRight className="size-3.5" />
            </a>
          )}
          <a
            href={star.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            GitHub <ExternalLink className="size-3.5" />
          </a>
        </div>
      </CardFooter>
    </Card>
  )
}

export function StarCard({ star, score, href }: Props) {
  return <CardBody star={star} score={score} href={href} />
}
