import { z } from 'zod'

import { hasActiveGuestAccess } from '@/common/active-guest-access'
import { checkRateLimit, rateLimitResponse } from '@/common/rate-limit'
import { searchYouTube, YouTubeApiError } from '@/lib/youtube'

export const dynamic = 'force-dynamic'

const roomIdSchema = z.uuid()

export async function GET(request: Request, context: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params
  const limit = checkRateLimit({ policy: 'youtubeSearch', headers: request.headers, scope: roomId })
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter)
  if (!roomIdSchema.safeParse(roomId).success || !(await hasActiveGuestAccess(roomId))) {
    return Response.json({ code: 'unauthorized' }, { status: 401 })
  }

  const parameters = new URL(request.url).searchParams
  try {
    const result = await searchYouTube(
      parameters.get('q'),
      parameters.get('pageToken') ?? undefined,
    )
    return Response.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { code: 'invalid_query', message: error.issues[0]?.message ?? 'Invalid search.' },
        { status: 400 },
      )
    }
    if (error instanceof YouTubeApiError) {
      const status = error.code === 'quota_exceeded' ? 429 : 503
      return Response.json({ code: error.code }, { status })
    }
    return Response.json({ code: 'unavailable' }, { status: 503 })
  }
}
