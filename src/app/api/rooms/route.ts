import { NextResponse } from 'next/server'

import { env } from '@/common/env'
import { saveHostRoomSession } from '@/common/host-room-session'
import { createRoom } from '@/common/rooms'

export async function POST() {
  try {
    const result = await createRoom()
    const guestUrl = new URL(`/join/${result.joinToken}`, env.APP_URL).toString()

    await saveHostRoomSession(result.room.id, result.hostCredential, result.joinToken)

    return NextResponse.json(
      {
        room: result.room,
        guestUrl,
        hostCredential: result.hostCredential,
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
