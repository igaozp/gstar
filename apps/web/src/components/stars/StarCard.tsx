import { Star, GitFork, ExternalLink, Cpu } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
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

function CardBody({ star, score }: { star: StarType; score?: number }) {
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={star.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-sm hover:underline text-foreground inline-flex items-center gap-1"
              >
                {star.fullName}
                <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
              {star.isArchived && (
                <Badge variant="outline" className="text-xs">archived</Badge>
              )}
            </div>
            {star.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {star.description}
              </p>
            )}
          </div>
          {score !== undefined && (
            <Badge variant="secondary" className="shrink-0 font-mono text-xs">
              {(score * 100).toFixed(0)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {star.aiSummary && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 border-l-2 border-muted pl-3 italic">
            {star.aiSummary}
          </p>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          {star.aiKeywords?.slice(0, 5).map((kw) => (
            <Badge key={kw} variant="outline" className="text-xs px-1.5 py-0">
              {kw}
            </Badge>
          ))}
          {star.topics?.slice(0, 3).map((topic) => (
            <Badge key={topic} variant="secondary" className="text-xs px-1.5 py-0">
              {topic}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {star.language && (
            <span className="flex items-center gap-1">
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full',
                  LANGUAGE_COLORS[star.language] ?? 'bg-gray-400'
                )}
              />
              {star.language}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {star.stargazersCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="h-3 w-3" />
            {star.forksCount.toLocaleString()}
          </span>
          {star.analyzedAt && (
            <span className="flex items-center gap-1 ml-auto">
              <Cpu className="h-3 w-3 text-green-500" />
              <span className="text-green-600 dark:text-green-400">analyzed</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function StarCard({ star, score, href }: Props) {
  if (href) {
    return (
      <a href={href} className="block cursor-pointer">
        <CardBody star={star} score={score} />
      </a>
    )
  }
  return <CardBody star={star} score={score} />
}
