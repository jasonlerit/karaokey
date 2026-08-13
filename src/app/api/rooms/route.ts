import { NextResponse } from 'next/server'

import { env } from '@/common/env'
import { saveHostRoomSession } from '@/common/host-room-session'
import { createRoom } from '@/common/rooms'
import { checkRateLimit, rateLimitResponse } from '@/common/rate-limit'

export async function POST(request: Request) {
  const limit = checkRateLimit({ policy: 'roomCreation', headers: request.headers })
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter)

  try {
    const result = await createRoom()
    const guestUrl = new URL(`/join/${result.joinToken}`, env.APP_URL).toString()

    await saveHostRoomSession(result.room.id, result.hostCredential, result.joinToken)

    return NextResponse.json(
      {
        room: result.room,
        guestUrl,
      },
      { status: 201 },
    )
  } catch {
    return NextResponse.json(
      { code: 'room_creation_failed', message: 'The room could not be created. Please try again.' },
      { status: 500 },
    )
  }
}
