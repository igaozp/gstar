import type { RepoAnalysis } from '../llm/types'
import { z } from 'zod'

const analysisSchema = z.object({
  summary: z.string(),
  keywords: z.array(z.string()),
})

/**
 * Build the text string used for embedding a repo.
 */
export function buildEmbeddingText(repo: {
  fullName: string
  description: string | null
  aiSummary: string | null
  aiKeywords: string | null
  language: string | null
  topics: string | null
}): string {
  const keywords = tryParseJson<string[]>(repo.aiKeywords, [])
  const topics = tryParseJson<string[]>(repo.topics, [])
  return [
    repo.fullName,
    repo.description,
    repo.aiSummary,
    keywords.join(' '),
    repo.language,
    topics.join(' '),
  ].filter(Boolean).join(' ')
}

/**
 * Build the prompt input for LLM analysis.
 */
export function buildAnalysisInput(repo: {
  fullName: string
  description: string | null
  topics: string | null
  language: string | null
}): string {
  const topics = tryParseJson<string[]>(repo.topics, [])
  return [
    repo.fullName,
    repo.description ?? '',
    topics.length ? `Topics: ${topics.join(', ')}` : '',
    repo.language ? `Language: ${repo.language}` : '',
  ].filter(Boolean).join('\n')
}

/**
 * Parse LLM chat response into RepoAnalysis.
 * Handles JSON embedded in markdown code blocks.
 */
export function parseAnalysisResponse(raw: string): RepoAnalysis {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  const parsed = analysisSchema.parse(JSON.parse(cleaned))
  return parsed
}

/**
 * Normalize a vector to unit length (for cosine similarity via L2 distance).
 */
export function normalizeVector(v: number[]): number[] {
  const magnitude = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0))
  if (magnitude === 0) return v
  return v.map(x => x / magnitude)
}

function tryParseJson<T>(val: string | null, fallback: T): T {
  if (!val) return fallback
  try { return JSON.parse(val) } catch { return fallback }
}
