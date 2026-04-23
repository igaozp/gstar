import { z } from 'zod'
import { resetLLMClient } from '../../utils/llm/provider'

const trimmedString = z.string().trim()

const bodySchema = z.object({
  githubUsername: trimmedString.optional(),
  githubToken: trimmedString.optional(),
  llmProvider: z.enum(['openai', 'openai_compatible', 'anthropic']).optional(),
  llmApiKey: trimmedString.optional(),
  llmBaseUrl: trimmedString.optional(),
  llmChatModel: trimmedString.optional(),
  llmTemperature: z.coerce.number().min(0).max(2).optional(),
  llmMaxTokens: z.coerce.number().int().min(1).max(200000).optional(),
  llmEmbeddingModel: trimmedString.optional(),
  llmEmbeddingDimensions: z.coerce.number().int().min(1).max(32768).optional(),
  llmEmbeddingApiKey: trimmedString.optional(),
  llmEmbeddingBaseUrl: trimmedString.optional(),
}).strict()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.message })
  }

  const updates = Object.fromEntries(
    Object.entries(parsed.data).filter(([, value]) => value !== undefined)
  )

  for (const [key, value] of Object.entries(updates)) {
    setAppConfig(key, value)
  }

  resetLLMClient()

  return {
    ok: true,
    data: {
      ...getPublicAppConfig(),
      overrides: getSanitizedAppConfigOverrides(),
    },
  }
})
