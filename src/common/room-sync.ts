import 'server-only'

import { asc, eq, sql } from 'drizzle-orm'

import type { RoomSnapshot } from '@/common/room-sync-state'
import { db } from '@/db'
import { guestSessions, rooms } from '@/db/schemas'

import { getActiveQueue } from './queue-items'
import { expireRooms } from './rooms'

export type RoomSubscriberRole = 'host' | 'guest'

export const getRoomSnapshot = async (
  roomId: string,
  role: RoomSubscriberRole,
): Promise<RoomSnapshot | undefined> => {
  await expireRooms()
  const room = await db.query.rooms.findFirst({ where: eq(rooms.id, roomId) })
  if (!room) return undefined

  const [[{ guestCount }], queue] = await Promise.all([
    db
      .select({ guestCount: sql<number>`count(*)::int` })
      .from(guestSessions)
      .where(eq(guestSessions.roomId, roomId)),
    getActiveQueue(roomId),
  ])

  const guests =
    role === 'host'
      ? await db
          .select({ id: guestSessions.id, displayName: guestSessions.displayName })
          .from(guestSessions)
          .where(eq(guestSessions.roomId, roomId))
          .orderBy(asc(guestSessions.createdAt))
      : undefined

  return {
    roomId: room.id,
    version: room.version,
    status: room.status,
    playback: {
      state: room.playbackState,
      positionSeconds: room.lastKnownPlaybackPositionSeconds,
    },
    presence: { guestCount, guests },
    queue,
  }
}
