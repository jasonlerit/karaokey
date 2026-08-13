import 'server-only'

import { and, eq, gt, lte, or, sql } from 'drizzle-orm'

import {
  generateRoomCode,
  generateSecret,
  hashHostCredential,
  hashJoinToken,
  verifyHostCredential,
} from '@/common/room-credentials'
import { getRoomExpiration } from '@/common/room-lifecycle'
import { db } from '@/db'
import { rooms, type Room } from '@/db/schemas'

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

export const expireRooms = async (now = new Date()) => {
  return db
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
}

const findRoom = async (roomId: string, now = new Date()) => {
  await expireRooms(now)

  return db.query.rooms.findFirst({ where: eq(rooms.id, roomId) })
}

export const createRoom = async (now = new Date()): Promise<CreateRoomResult> => {
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
  const access = await getHostRoom(roomId, hostCredential, now)
  if (access.code !== 'ok') return access

  const [endedRoom] = await db
    .update(rooms)
    .set({
      status: 'ended',
      playbackState: 'idle',
      endedAt: now,
      version: sql`${rooms.version} + 1`,
    })
    .where(
      and(
        eq(rooms.id, roomId),
        eq(rooms.status, 'active'),
        gt(rooms.expiresAt, now),
        gt(rooms.absoluteExpiresAt, now),
      ),
    )
    .returning()

  if (endedRoom) return { code: 'ok', room: toRoomView(endedRoom) }

  const latest = await findRoom(roomId, now)
  if (!latest) return { code: 'not_found' }
  if (latest.status === 'ended') return { code: 'room_ended' }
  if (latest.status === 'expired') return { code: 'room_expired' }

  return { code: 'invalid_host_credential' }
}
