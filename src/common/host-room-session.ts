import 'server-only'

import { cookies } from 'next/headers'

import { env } from '@/common/env'
import { ROOM_ABSOLUTE_LIFETIME_MS } from '@/common/room-lifecycle'

const HOST_COOKIE_PREFIX = 'karaokey_host_'
const JOIN_COOKIE_PREFIX = 'karaokey_join_'

const cookieOptions = {
  httpOnly: true,
  maxAge: ROOM_ABSOLUTE_LIFETIME_MS / 1000,
  path: '/',
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
}

export const saveHostRoomSession = async (
  roomId: string,
  hostCredential: string,
  joinToken: string,
) => {
  const cookieStore = await cookies()
  cookieStore.set(`${HOST_COOKIE_PREFIX}${roomId}`, hostCredential, cookieOptions)
  cookieStore.set(`${JOIN_COOKIE_PREFIX}${roomId}`, joinToken, cookieOptions)
}

export const getHostCredential = async (roomId: string) => {
  const cookieStore = await cookies()
  return cookieStore.get(`${HOST_COOKIE_PREFIX}${roomId}`)?.value
}

export const getHostJoinToken = async (roomId: string) => {
  const cookieStore = await cookies()
  return cookieStore.get(`${JOIN_COOKIE_PREFIX}${roomId}`)?.value
}
