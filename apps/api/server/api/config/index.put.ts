import { z } from 'zod'
import { resetLLMClient } from '../../utils/llm/provider'

const bodySchema = z.record(z.string(), z.unknown())

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.message })
  }

  for (const [key, value] of Object.entries(parsed.data)) {
    setAppConfig(key, value)
  }

  // Reset LLM client so it picks up new config on next call
  resetLLMClient()

  return { ok: true, data: getAllAppConfig() }
})
