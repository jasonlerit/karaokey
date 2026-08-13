import { z } from 'zod'

import { getGuestRoomCredential } from '@/common/guest-session-cookie'
import { getGuestSessionByRoomId } from '@/common/guest-sessions'
import { removeQueueItem } from '@/common/queue-items'

export const dynamic = 'force-dynamic'

const idSchema = z.uuid()

const statusByCode = {
  not_found: 404,
  not_owner: 403,
  not_queued: 409,
} as const

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ roomId: string; itemId: string }> },
) {
  const { roomId, itemId } = await context.params
  if (!idSchema.safeParse(roomId).success || !idSchema.safeParse(itemId).success) {
    return Response.json({ code: 'not_found' }, { status: 404 })
  }

  const credential = await getGuestRoomCredential(roomId)
  const guest = await getGuestSessionByRoomId(roomId, credential)
  if (guest.code !== 'ok') {
    return Response.json({ code: 'invalid_session' }, { status: 401 })
  }

  try {
    const result = await removeQueueItem({ roomId, itemId, guestId: guest.guest.id })
    if (result.code !== 'ok') {
      return Response.json({ code: result.code }, { status: statusByCode[result.code] })
    }
    return Response.json(result)
  } catch {
    return Response.json({ code: 'unavailable' }, { status: 503 })
  }
}
