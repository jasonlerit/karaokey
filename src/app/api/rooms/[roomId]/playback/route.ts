import { z } from 'zod'

import { getHostCredential } from '@/common/host-room-session'
import { advancePlayback, playbackOutcomes, startPlayback } from '@/common/playback-lifecycle'
import { getHostRoom } from '@/common/rooms'

export const dynamic = 'force-dynamic'

const roomIdSchema = z.uuid()
const commandSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start') }),
  z.object({
    action: z.literal('advance'),
    expectedCurrentItemId: z.uuid(),
    outcome: z.enum(playbackOutcomes),
    positionSeconds: z.int().min(0),
  }),
])

const statusByCode = {
  not_found: 404,
  invalid_host_credential: 401,
  room_ended: 409,
  room_expired: 410,
  queue_empty: 409,
  already_started: 409,
  stale_current_item: 409,
  invalid_transition: 409,
} as const

const respondWithError = (code: keyof typeof statusByCode) =>
  Response.json({ code }, { status: statusByCode[code] })

export async function POST(request: Request, context: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params
  if (!roomIdSchema.safeParse(roomId).success) return respondWithError('not_found')

  const credential = await getHostCredential(roomId)
  const access = await getHostRoom(roomId, credential)
  if (access.code !== 'ok') return respondWithError(access.code)

  try {
    const command = commandSchema.parse(await request.json())
    const result =
      command.action === 'start'
        ? await startPlayback(roomId)
        : await advancePlayback({ roomId, ...command })

    return result.code === 'ok' ? Response.json(result) : respondWithError(result.code)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ code: 'invalid_request' }, { status: 400 })
    }
    return Response.json({ code: 'unavailable' }, { status: 503 })
  }
}
