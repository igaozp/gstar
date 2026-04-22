import { z } from 'zod'

const bodySchema = z.object({
  type: z.enum(['full', 'incremental']).default('incremental'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.message })
  }

  const taskName = parsed.data.type === 'full' ? 'sync:full' : 'sync:incremental'

  try {
    const result = await runTask(taskName, {})
    return { ok: true, data: result }
  } catch (err) {
    throw createError({ statusCode: 500, message: (err as Error).message })
  }
})
