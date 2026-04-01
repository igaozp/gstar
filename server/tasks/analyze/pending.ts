import { buildAnalysisInput, buildEmbeddingText, parseAnalysisResponse, normalizeVector } from '../../utils/search/embed'

const BATCH_SIZE = 10

export default defineTask({
  meta: {
    name: 'analyze:pending',
    description: 'Analyze pending repos with LLM: generate summary, keywords, and embeddings',
  },
  async run() {
    const config = useRuntimeConfig()
    if (!config.llmApiKey) {
      console.warn('[analyze:pending] LLM not configured, skipping')
      return { result: { processed: 0, reason: 'LLM not configured' } }
    }

    const db = getDb()
    const llm = getLLMClient()

    const pending = db.prepare(`
      SELECT id, full_name, description, language, topics
      FROM stars
      WHERE analyzed_at IS NULL
      ORDER BY starred_at DESC
      LIMIT ?
    `).all(BATCH_SIZE) as Array<{
      id: number
      full_name: string
      description: string | null
      language: string | null
      topics: string | null
    }>

    if (pending.length === 0) {
      console.log('[analyze:pending] No pending repos')
      return { result: { processed: 0 } }
    }

    console.log(`[analyze:pending] Processing ${pending.length} repos`)
    let processed = 0

    for (const repo of pending) {
      try {
        // Step 1: LLM analysis (summary + keywords)
        const input = buildAnalysisInput({
          fullName: repo.full_name,
          description: repo.description,
          topics: repo.topics,
          language: repo.language,
        })

        const raw = await llm.chat([
          {
            role: 'system',
            content: 'You analyze GitHub repositories and extract structured metadata. Respond ONLY with valid JSON, no commentary.',
          },
          {
            role: 'user',
            content: `Analyze this repository:\n${input}\n\nReturn JSON: {"summary": "<2-3 sentences explaining what this repo does and who it\'s for>", "keywords": ["<5-10 lowercase keywords, specific and meaningful>"]}`,
          },
        ])

        const analysis = parseAnalysisResponse(raw)

        // Step 2: Write analysis to stars table
        db.prepare(`
          UPDATE stars
          SET ai_summary = ?, ai_keywords = ?, analysis_model = ?, analyzed_at = ?
          WHERE id = ?
        `).run(
          analysis.summary,
          JSON.stringify(analysis.keywords),
          config.llmChatModel,
          new Date().toISOString(),
          repo.id
        )

        // Step 3: Generate embedding
        const embeddingText = buildEmbeddingText({
          fullName: repo.full_name,
          description: repo.description,
          aiSummary: analysis.summary,
          aiKeywords: JSON.stringify(analysis.keywords),
          language: repo.language,
          topics: repo.topics,
        })

        const rawVector = await llm.embed(embeddingText)
        const vector = normalizeVector(rawVector)
        const dims = config.llmEmbeddingDimensions || 1536

        // Step 4: Store embedding in sqlite-vec virtual table
        db.prepare(`
          INSERT OR REPLACE INTO vec_stars (repo_id, embedding)
          VALUES (?, ?)
        `).run(repo.id, new Float32Array(vector).buffer)

        db.prepare(`
          INSERT OR REPLACE INTO embeddings (repo_id, embedding_model, dimensions, created_at)
          VALUES (?, ?, ?, ?)
        `).run(repo.id, config.llmEmbeddingModel, dims, new Date().toISOString())

        processed++
        console.log(`[analyze:pending] ✓ ${repo.full_name}`)
      } catch (err) {
        console.error(`[analyze:pending] ✗ ${repo.full_name}:`, (err as Error).message)
        // Continue with next repo, don't fail the whole batch
      }
    }

    return { result: { processed, total: pending.length } }
  },
})
