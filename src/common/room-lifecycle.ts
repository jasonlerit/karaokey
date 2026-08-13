import type { RoomStatus } from '@/db/schemas'

export const ROOM_INACTIVITY_LIFETIME_MS = 6 * 60 * 60 * 1000
export const ROOM_ABSOLUTE_LIFETIME_MS = 12 * 60 * 60 * 1000

export const getRoomExpiration = (createdAt: Date) => {
  const expiresAt = new Date(createdAt.getTime() + ROOM_INACTIVITY_LIFETIME_MS)
  const absoluteExpiresAt = new Date(createdAt.getTime() + ROOM_ABSOLUTE_LIFETIME_MS)

  return { expiresAt, absoluteExpiresAt }
}

export const getEffectiveRoomStatus = (
  status: RoomStatus,
  expiresAt: Date,
  absoluteExpiresAt: Date,
  now: Date,
): RoomStatus => {
  if (status !== 'active') {
    return status
  }

  return expiresAt <= now || absoluteExpiresAt <= now ? 'expired' : 'active'
}
