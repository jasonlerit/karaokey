import 'server-only'

import { and, eq, lte, or, sql } from 'drizzle-orm'

import {
  generateRoomCode,
  generateSecret,
  hashHostCredential,
  hashJoinToken,
  verifyHostCredential,
} from '@/common/room-credentials'
import { getRoomRetentionCutoff } from '@/common/data-retention'
import { getRoomExpiration } from '@/common/room-lifecycle'
import { db } from '@/db'
import { queueItems, rooms, type Room } from '@/db/schemas'

const ROOM_CREATION_ATTEMPTS = 5

export type RoomView = Pick<
  Room,
  | 'id'
  | 'roomCode'
  | 'status'
  | 'playbackState'
  | 'currentQueueItemId'
  | 'lastKnownPlaybackPositionSeconds'
  | 'version'
  | 'createdAt'
  | 'lastActiveAt'
  | 'expiresAt'
  | 'absoluteExpiresAt'
  | 'endedAt'
  | 'expiredAt'
>

export type CreateRoomResult = {
  room: RoomView
  joinToken: string
  hostCredential: string
}

export type RoomAccessResult =
  | { code: 'ok'; room: RoomView }
  | { code: 'not_found' | 'invalid_host_credential' | 'room_ended' | 'room_expired' }

const toRoomView = (room: Room): RoomView => ({
  id: room.id,
  roomCode: room.roomCode,
  status: room.status,
  playbackState: room.playbackState,
  currentQueueItemId: room.currentQueueItemId,
  lastKnownPlaybackPositionSeconds: room.lastKnownPlaybackPositionSeconds,
  version: room.version,
  createdAt: room.createdAt,
  lastActiveAt: room.lastActiveAt,
  expiresAt: room.expiresAt,
  absoluteExpiresAt: room.absoluteExpiresAt,
  endedAt: room.endedAt,
  expiredAt: room.expiredAt,
})

const isUniqueViolation = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false
  if ('code' in error && error.code === '23505') return true

  return 'cause' in error && isUniqueViolation(error.cause)
}

const expireRoomsOnly = async (now: Date) =>
  db
    .update(rooms)
    .set({
      status: 'expired',
      playbackState: 'idle',
      expiredAt: now,
      version: sql`${rooms.version} + 1`,
    })
    .where(
      and(
        eq(rooms.status, 'active'),
        or(lte(rooms.expiresAt, now), lte(rooms.absoluteExpiresAt, now)),
      ),
    )
    .returning({ id: rooms.id })

const deleteRetainedRoomData = (now: Date) => {
  const cutoff = getRoomRetentionCutoff(now)
  return db
    .delete(rooms)
    .where(
      or(
        and(eq(rooms.status, 'expired'), lte(rooms.expiredAt, cutoff)),
        and(eq(rooms.status, 'ended'), lte(rooms.endedAt, cutoff)),
      ),
    )
    .returning({ id: rooms.id })
}

export const expireRooms = async (now = new Date()) => {
  const expired = await expireRoomsOnly(now)
  await deleteRetainedRoomData(now)
  return expired
}

export const cleanupExpiredRoomData = async (now = new Date()) => {
  await expireRoomsOnly(now)
  return deleteRetainedRoomData(now)
}

const findRoom = async (roomId: string, now = new Date()) => {
  await expireRooms(now)

  return db.query.rooms.findFirst({ where: eq(rooms.id, roomId) })
}

export const createRoom = async (now = new Date()): Promise<CreateRoomResult> => {
  await cleanupExpiredRoomData(now)
  const { expiresAt, absoluteExpiresAt } = getRoomExpiration(now)

  for (let attempt = 0; attempt < ROOM_CREATION_ATTEMPTS; attempt += 1) {
    const roomCode = generateRoomCode()
    const joinToken = generateSecret()
    const hostCredential = generateSecret()
    const hostCredentialHash = await hashHostCredential(hostCredential)

    try {
      const [room] = await db
        .insert(rooms)
        .values({
          roomCode,
          joinTokenHash: hashJoinToken(joinToken),
          hostCredentialHash,
          createdAt: now,
          lastActiveAt: now,
          expiresAt,
          absoluteExpiresAt,
        })
        .returning()

      if (!room) throw new Error('Room creation did not return a room')

      return { room: toRoomView(room), joinToken, hostCredential }
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === ROOM_CREATION_ATTEMPTS - 1) throw error
    }
  }

  throw new Error('Unable to allocate a unique room identity')
}

export const getHostRoom = async (
  roomId: string,
  hostCredential: string | undefined,
  now = new Date(),
): Promise<RoomAccessResult> => {
  const room = await findRoom(roomId, now)

  if (!room) return { code: 'not_found' }
  if (room.status === 'ended') return { code: 'room_ended' }
  if (room.status === 'expired') return { code: 'room_expired' }
  if (!hostCredential || !(await verifyHostCredential(hostCredential, room.hostCredentialHash))) {
    return { code: 'invalid_host_credential' }
  }

  return { code: 'ok', room: toRoomView(room) }
}

export const getRoomByJoinToken = async (
  joinToken: string,
  now = new Date(),
): Promise<RoomAccessResult> => {
  await expireRooms(now)

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.joinTokenHash, hashJoinToken(joinToken)),
  })

  if (!room) return { code: 'not_found' }
  if (room.status === 'ended') return { code: 'room_ended' }
  if (room.status === 'expired') return { code: 'room_expired' }

  return { code: 'ok', room: toRoomView(room) }
}

export const endRoom = async (
  roomId: string,
  hostCredential: string | undefined,
  now = new Date(),
): Promise<RoomAccessResult> => {
  return db.transaction(async (tx) => {
    const [room] = await tx.select().from(rooms).where(eq(rooms.id, roomId)).for('update')
    if (!room) return { code: 'not_found' }
    if (room.status === 'ended') return { code: 'room_ended' }
    if (room.status === 'expired' || room.expiresAt <= now || room.absoluteExpiresAt <= now) {
      if (room.status === 'active') {
        await tx
          .update(rooms)
          .set({
            status: 'expired',
            playbackState: 'idle',
            currentQueueItemId: null,
            lastKnownPlaybackPositionSeconds: 0,
            expiredAt: now,
            version: sql`${rooms.version} + 1`,
          })
          .where(eq(rooms.id, roomId))
      }
      return { code: 'room_expired' }
    }
    if (!hostCredential || !(await verifyHostCredential(hostCredential, room.hostCredentialHash))) {
      return { code: 'invalid_host_credential' }
    }

    if (room.currentQueueItemId) {
      await tx
        .update(queueItems)
        .set({ status: 'skipped', endedAt: now })
        .where(
          and(
            eq(queueItems.id, room.currentQueueItemId),
            eq(queueItems.roomId, roomId),
            eq(queueItems.status, 'current'),
          ),
        )
    }

    const [endedRoom] = await tx
      .update(rooms)
      .set({
        status: 'ended',
        playbackState: 'idle',
        currentQueueItemId: null,
        lastKnownPlaybackPositionSeconds: 0,
        endedAt: now,
        lastActiveAt: now,
        version: sql`${rooms.version} + 1`,
      })
      .where(eq(rooms.id, roomId))
      .returning()
    if (!endedRoom) throw new Error('Ending the locked room did not return it')

    return { code: 'ok', room: toRoomView(endedRoom) }
  })
}
