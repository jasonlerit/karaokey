'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { z } from 'zod'

import { saveHostRoomSession, getHostCredential } from '@/common/host-room-session'
import { checkRateLimit } from '@/common/rate-limit'
import { createRoom, endRoom } from '@/common/rooms'

const roomIdSchema = z.uuid()

export const createRoomAction = async () => {
  const limit = checkRateLimit({ policy: 'roomCreation', headers: await headers() })
  if (!limit.allowed) redirect(`/?error=rate_limited&retryAfter=${limit.retryAfter}`)

  const result = await createRoom()
  await saveHostRoomSession(result.room.id, result.hostCredential, result.joinToken)

  redirect(`/rooms/${result.room.id}`)
}

export const endRoomAction = async (roomId: string) => {
  const parsedRoomId = roomIdSchema.safeParse(roomId)
  if (!parsedRoomId.success) redirect('/')

  const credential = await getHostCredential(parsedRoomId.data)
  await endRoom(parsedRoomId.data, credential)

  redirect(`/rooms/${parsedRoomId.data}`)
}
