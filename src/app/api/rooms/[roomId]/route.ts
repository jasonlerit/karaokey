import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getHostCredential } from '@/common/host-room-session'
import { endRoom, getHostRoom, type RoomAccessResult } from '@/common/rooms'

const roomIdSchema = z.uuid()

const errorResponse = (result: Exclude<RoomAccessResult, { code: 'ok' }>) => {
  const responses = {
    not_found: { status: 404, message: 'This room does not exist.' },
    invalid_host_credential: { status: 401, message: 'Host access could not be verified.' },
    room_ended: { status: 409, message: 'This room has ended.' },
    room_expired: { status: 410, message: 'This room has expired.' },
  } as const
  const response = responses[result.code]

  return NextResponse.json(
    { code: result.code, message: response.message },
    { status: response.status },
  )
}

type RoomRouteContext = { params: Promise<{ roomId: string }> }

const readRoomId = async (context: RoomRouteContext) => {
  const { roomId } = await context.params
  return roomIdSchema.safeParse(roomId)
}

export async function GET(_request: Request, context: RoomRouteContext) {
  const parsedRoomId = await readRoomId(context)
  if (!parsedRoomId.success) {
    return NextResponse.json(
      { code: 'not_found', message: 'This room does not exist.' },
      { status: 404 },
    )
  }

  const credential = await getHostCredential(parsedRoomId.data)
  const result = await getHostRoom(parsedRoomId.data, credential)

  return result.code === 'ok' ? NextResponse.json({ room: result.room }) : errorResponse(result)
}

export async function DELETE(_request: Request, context: RoomRouteContext) {
  const parsedRoomId = await readRoomId(context)
  if (!parsedRoomId.success) {
    return NextResponse.json(
      { code: 'not_found', message: 'This room does not exist.' },
      { status: 404 },
    )
  }

  const credential = await getHostCredential(parsedRoomId.data)
  const result = await endRoom(parsedRoomId.data, credential)

  return result.code === 'ok' ? NextResponse.json({ room: result.room }) : errorResponse(result)
}
