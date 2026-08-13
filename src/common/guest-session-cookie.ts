import 'server-only'

import { cookies } from 'next/headers'

import { env } from '@/common/env'
import { ROOM_ABSOLUTE_LIFETIME_MS } from '@/common/room-lifecycle'

const GUEST_COOKIE_PREFIX = 'karaokey_guest_'

const cookieOptions = {
  httpOnly: true,
  maxAge: ROOM_ABSOLUTE_LIFETIME_MS / 1000,
  path: '/',
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
}

export const saveGuestRoomSession = async (roomId: string, credential: string) => {
  const cookieStore = await cookies()
  cookieStore.set(`${GUEST_COOKIE_PREFIX}${roomId}`, credential, cookieOptions)
}

export const getGuestRoomCredential = async (roomId: string) => {
  const cookieStore = await cookies()
  return cookieStore.get(`${GUEST_COOKIE_PREFIX}${roomId}`)?.value
}
