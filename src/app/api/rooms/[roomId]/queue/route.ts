import { z } from 'zod'

import { getGuestRoomCredential } from '@/common/guest-session-cookie'
import { getGuestSessionByRoomId } from '@/common/guest-sessions'
import { addQueueItem, getQueueItemByIdempotencyKey } from '@/common/queue-items'
import { checkRateLimit, rateLimitResponse } from '@/common/rate-limit'
import { validateYouTubeVideo, YouTubeApiError, youtubeVideoIdSchema } from '@/lib/youtube'

export const dynamic = 'force-dynamic'

const roomIdSchema = z.uuid()
const bodySchema = z.object({
  videoId: youtubeVideoIdSchema,
  idempotencyKey: z.uuid(),
})

const statusByCode = {
  not_found: 404,
  room_ended: 409,
  room_expired: 409,
  invalid_session: 401,
  duplicate_video: 409,
  guest_limit_reached: 409,
  room_limit_reached: 409,
} as const

export async function POST(request: Request, context: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params
  if (!roomIdSchema.safeParse(roomId).success) {
    return Response.json({ code: 'not_found' }, { status: 404 })
  }

  const credential = await getGuestRoomCredential(roomId)
  const guest = await getGuestSessionByRoomId(roomId, credential)
  if (guest.code !== 'ok') {
    return Response.json({ code: 'invalid_session' }, { status: 401 })
  }

  const limit = checkRateLimit({
    policy: 'queueMutation',
    headers: request.headers,
    scope: guest.guest.id,
  })
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter)

  try {
    const body = bodySchema.parse(await request.json())
    const existing = await getQueueItemByIdempotencyKey(guest.guest.id, body.idempotencyKey)
    if (existing) return Response.json({ code: 'ok', item: existing, replayed: true })

    const video = await validateYouTubeVideo(body.videoId)
    if (!video) return Response.json({ code: 'video_unavailable' }, { status: 404 })

    const result = await addQueueItem({
      roomId,
      guestId: guest.guest.id,
      guestDisplayName: guest.guest.displayName,
      idempotencyKey: body.idempotencyKey,
      video,
    })
    if (result.code !== 'ok') {
      return Response.json({ code: result.code }, { status: statusByCode[result.code] })
    }

    return Response.json(result, { status: result.replayed ? 200 : 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ code: 'invalid_request' }, { status: 400 })
    }
    if (error instanceof YouTubeApiError) {
      const status = error.code === 'quota_exceeded' ? 429 : 503
      return Response.json({ code: error.code }, { status })
    }
    return Response.json({ code: 'unavailable' }, { status: 503 })
  }
}
