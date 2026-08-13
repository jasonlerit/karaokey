import { z } from 'zod'

import { recordOperationalEvent } from '@/common/operational-events'
import { checkRateLimit, rateLimitResponse } from '@/common/rate-limit'

const eventSchema = z.object({ event: z.literal('realtime_reconnected') }).strict()

export async function POST(request: Request) {
  const limit = checkRateLimit({ policy: 'telemetry', headers: request.headers })
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter)

  const event = eventSchema.safeParse(await request.json().catch(() => undefined))
  if (!event.success) return Response.json({ code: 'invalid_request' }, { status: 400 })

  recordOperationalEvent(event.data)
  return new Response(null, { status: 204 })
}
