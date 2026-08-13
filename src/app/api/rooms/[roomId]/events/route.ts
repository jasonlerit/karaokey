import { z } from 'zod'

import { getGuestRoomCredential } from '@/common/guest-session-cookie'
import { getGuestSessionByRoomId } from '@/common/guest-sessions'
import { getHostCredential } from '@/common/host-room-session'
import { getRoomSnapshot, type RoomSubscriberRole } from '@/common/room-sync'
import type { RoomSyncMessage } from '@/common/room-sync-state'
import { getHostRoom } from '@/common/rooms'

export const dynamic = 'force-dynamic'

const encoder = new TextEncoder()
const roomIdSchema = z.uuid()

const authorize = async (roomId: string): Promise<RoomSubscriberRole | undefined> => {
  const hostCredential = await getHostCredential(roomId)
  if (hostCredential) {
    const host = await getHostRoom(roomId, hostCredential)
    if (host.code === 'ok') return 'host'
  }

  const guestCredential = await getGuestRoomCredential(roomId)
  const guest = await getGuestSessionByRoomId(roomId, guestCredential)
  return guest.code === 'ok' ? 'guest' : undefined
}

const serializeSnapshot = (message: RoomSyncMessage) =>
  `id: ${message.eventId}\nevent: snapshot\ndata: ${JSON.stringify(message)}\n\n`

export async function GET(request: Request, context: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params
  const parsedRoomId = roomIdSchema.safeParse(roomId)
  if (!parsedRoomId.success) return new Response('Not found', { status: 404 })

  const role = await authorize(parsedRoomId.data)
  if (!role) return new Response('Unauthorized', { status: 401 })

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let deliveredVersion = -1

      while (!request.signal.aborted) {
        try {
          const snapshot = await getRoomSnapshot(parsedRoomId.data, role)
          if (!snapshot) break

          if (snapshot.version > deliveredVersion) {
            const eventId = `${snapshot.roomId}:${snapshot.version}`
            controller.enqueue(
              encoder.encode(serializeSnapshot({ eventId, type: 'snapshot', snapshot })),
            )
            deliveredVersion = snapshot.version
          } else {
            controller.enqueue(encoder.encode(': keep-alive\n\n'))
          }
        } catch {
          break
        }

        await new Promise((resolve) => setTimeout(resolve, 1_000))
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'X-Accel-Buffering': 'no',
    },
  })
}
