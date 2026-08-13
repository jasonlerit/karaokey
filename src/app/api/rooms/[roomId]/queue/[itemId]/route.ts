import { z } from 'zod'

import { getGuestRoomCredential } from '@/common/guest-session-cookie'
import { getGuestSessionByRoomId } from '@/common/guest-sessions'
import { getHostCredential } from '@/common/host-room-session'
import { removeQueueItem, removeQueueItemAsHost } from '@/common/queue-items'
import { checkRateLimit, rateLimitResponse } from '@/common/rate-limit'
import { getHostRoom } from '@/common/rooms'
import { recordOperationalEvent } from '@/common/operational-events'

export const dynamic = 'force-dynamic'

const idSchema = z.uuid()

const statusByCode = {
  not_found: 404,
  not_owner: 403,
  not_queued: 409,
  room_ended: 409,
  room_expired: 410,
} as const

export async function DELETE(
  request: Request,
  context: { params: Promise<{ roomId: string; itemId: string }> },
) {
  const { roomId, itemId } = await context.params
  if (!idSchema.safeParse(roomId).success || !idSchema.safeParse(itemId).success) {
    return Response.json({ code: 'not_found' }, { status: 404 })
  }

  try {
    const hostCredential = await getHostCredential(roomId)
    const host = hostCredential ? await getHostRoom(roomId, hostCredential) : undefined
    const guestCredential = await getGuestRoomCredential(roomId)
    const guest =
      host?.code === 'ok' ? undefined : await getGuestSessionByRoomId(roomId, guestCredential)

    const actorId =
      host?.code === 'ok' ? `host:${roomId}` : guest?.code === 'ok' ? guest.guest.id : undefined
    if (actorId) {
      const limit = checkRateLimit({
        policy: 'queueMutation',
        headers: request.headers,
        scope: actorId,
      })
      if (!limit.allowed) return rateLimitResponse(limit.retryAfter)
    }

    const result =
      host?.code === 'ok'
        ? await removeQueueItemAsHost({ roomId, itemId })
        : guest?.code === 'ok'
          ? await removeQueueItem({ roomId, itemId, guestId: guest.guest.id })
          : undefined
    if (!result) return Response.json({ code: 'invalid_session' }, { status: 401 })
    if (result.code !== 'ok') {
      return Response.json({ code: result.code }, { status: statusByCode[result.code] })
    }
    return Response.json(result)
  } catch {
    recordOperationalEvent({ event: 'queue_failure', operation: 'remove' })
    return Response.json({ code: 'unavailable' }, { status: 503 })
  }
}
