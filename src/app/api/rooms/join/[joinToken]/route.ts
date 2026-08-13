import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getRoomByJoinToken } from '@/common/rooms'

const joinTokenSchema = z
  .string()
  .min(40)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/)

export async function GET(_request: Request, context: { params: Promise<{ joinToken: string }> }) {
  const { joinToken } = await context.params
  const parsedToken = joinTokenSchema.safeParse(joinToken)

  if (!parsedToken.success) {
    return NextResponse.json(
      { code: 'not_found', message: 'This room does not exist.' },
      { status: 404 },
    )
  }

  const result = await getRoomByJoinToken(parsedToken.data)

  if (result.code === 'ok') return NextResponse.json({ room: result.room })

  const status = result.code === 'room_expired' ? 410 : result.code === 'room_ended' ? 409 : 404
  const message =
    result.code === 'room_expired'
      ? 'This room has expired.'
      : result.code === 'room_ended'
        ? 'This room has ended.'
        : 'This room does not exist.'

  return NextResponse.json({ code: result.code, message }, { status })
}
