import { z } from 'zod'

import { hasActiveGuestAccess } from '@/common/active-guest-access'
import { checkRateLimit, rateLimitResponse } from '@/common/rate-limit'
import { validateYouTubeVideo, YouTubeApiError } from '@/lib/youtube'

export const dynamic = 'force-dynamic'

const roomIdSchema = z.uuid()
const bodySchema = z.object({ videoId: z.string() })

export async function POST(request: Request, context: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params
  const limit = checkRateLimit({ policy: 'youtubeSearch', headers: request.headers, scope: roomId })
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter)
  if (!roomIdSchema.safeParse(roomId).success || !(await hasActiveGuestAccess(roomId))) {
    return Response.json({ code: 'unauthorized' }, { status: 401 })
  }

  try {
    const body = bodySchema.parse(await request.json())
    const video = await validateYouTubeVideo(body.videoId)
    if (!video) return Response.json({ code: 'video_unavailable' }, { status: 404 })
    return Response.json({ video })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ code: 'video_unavailable' }, { status: 400 })
    }
    if (error instanceof YouTubeApiError) {
      const status = error.code === 'quota_exceeded' ? 429 : 503
      return Response.json({ code: error.code }, { status })
    }
    return Response.json({ code: 'unavailable' }, { status: 503 })
  }
}
