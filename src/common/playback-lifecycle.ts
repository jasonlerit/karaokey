import 'server-only'

import { and, asc, eq, sql } from 'drizzle-orm'

import {
  getAdvancePlaybackRejection,
  getStartPlaybackRejection,
  type PlaybackTransitionCode,
} from '@/common/playback-policy'
import { db } from '@/db'
import { queueItems, rooms, type QueueItem } from '@/db/schemas'

export const playbackOutcomes = ['completed', 'skipped', 'failed'] as const
export type PlaybackOutcome = (typeof playbackOutcomes)[number]

export type PlaybackTransitionView = {
  roomId: string
  version: number
  playback: {
    state: 'idle' | 'playing'
    currentItemId: string | null
    positionSeconds: number
  }
  previousItem?: { id: string; status: PlaybackOutcome }
  currentItem?: { id: string; status: 'current' }
}

export type PlaybackTransitionResult =
  | { code: 'ok'; transition: PlaybackTransitionView }
  | { code: PlaybackTransitionCode | 'not_found' }

const findNextQueuedItem = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  roomId: string,
) =>
  tx.query.queueItems.findFirst({
    where: and(eq(queueItems.roomId, roomId), eq(queueItems.status, 'queued')),
    orderBy: asc(queueItems.sequence),
  })

const promoteItem = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  item: QueueItem,
  now: Date,
) => {
  const [promoted] = await tx
    .update(queueItems)
    .set({ status: 'current', startedAt: now, endedAt: null })
    .where(and(eq(queueItems.id, item.id), eq(queueItems.status, 'queued')))
    .returning({ id: queueItems.id })
  if (!promoted) throw new Error('Queued item could not be promoted while the room was locked')
  return promoted
}

const expireLockedRoom = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  roomId: string,
  now: Date,
) => {
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

export const startPlayback = async (
  roomId: string,
  now = new Date(),
): Promise<PlaybackTransitionResult> =>
  db.transaction(async (tx) => {
    const [room] = await tx.select().from(rooms).where(eq(rooms.id, roomId)).for('update')
    if (!room) return { code: 'not_found' }

    if (room.status === 'active' && (room.expiresAt <= now || room.absoluteExpiresAt <= now)) {
      await expireLockedRoom(tx, roomId, now)
      return { code: 'room_expired' }
    }

    const nextItem = await findNextQueuedItem(tx, roomId)
    const rejection = getStartPlaybackRejection({
      roomStatus: room.status,
      playbackState: room.playbackState,
      currentItemId: room.currentQueueItemId,
      hasQueuedItem: Boolean(nextItem),
    })
    if (rejection) return { code: rejection }
    if (!nextItem) return { code: 'queue_empty' }

    const promoted = await promoteItem(tx, nextItem, now)
    const [updatedRoom] = await tx
      .update(rooms)
      .set({
        currentQueueItemId: promoted.id,
        playbackState: 'playing',
        lastKnownPlaybackPositionSeconds: 0,
        lastActiveAt: now,
        version: sql`${rooms.version} + 1`,
      })
      .where(eq(rooms.id, roomId))
      .returning({ version: rooms.version })
    if (!updatedRoom) throw new Error('Playback start did not update the locked room')

    return {
      code: 'ok',
      transition: {
        roomId,
        version: updatedRoom.version,
        playback: { state: 'playing', currentItemId: promoted.id, positionSeconds: 0 },
        currentItem: { id: promoted.id, status: 'current' },
      },
    }
  })

export const advancePlayback = async ({
  roomId,
  expectedCurrentItemId,
  outcome,
  positionSeconds,
  now = new Date(),
}: {
  roomId: string
  expectedCurrentItemId: string
  outcome: PlaybackOutcome
  positionSeconds: number
  now?: Date
}): Promise<PlaybackTransitionResult> =>
  db.transaction(async (tx) => {
    const [room] = await tx.select().from(rooms).where(eq(rooms.id, roomId)).for('update')
    if (!room) return { code: 'not_found' }

    if (room.status === 'active' && (room.expiresAt <= now || room.absoluteExpiresAt <= now)) {
      await expireLockedRoom(tx, roomId, now)
      return { code: 'room_expired' }
    }

    const currentItem = await tx.query.queueItems.findFirst({
      where: and(eq(queueItems.id, expectedCurrentItemId), eq(queueItems.roomId, roomId)),
    })
    const rejection = getAdvancePlaybackRejection({
      roomStatus: room.status,
      currentItemId: room.currentQueueItemId,
      expectedCurrentItemId,
      currentItemStatus: currentItem?.status,
    })
    if (rejection) return { code: rejection }

    const [finished] = await tx
      .update(queueItems)
      .set({ status: outcome, endedAt: now })
      .where(
        and(
          eq(queueItems.id, expectedCurrentItemId),
          eq(queueItems.roomId, roomId),
          eq(queueItems.status, 'current'),
        ),
      )
      .returning({ id: queueItems.id })
    if (!finished) return { code: 'invalid_transition' }

    const nextItem = await findNextQueuedItem(tx, roomId)
    const promoted = nextItem ? await promoteItem(tx, nextItem, now) : undefined
    const [updatedRoom] = await tx
      .update(rooms)
      .set({
        currentQueueItemId: promoted?.id ?? null,
        playbackState: promoted ? 'playing' : 'idle',
        lastKnownPlaybackPositionSeconds: promoted ? 0 : positionSeconds,
        lastActiveAt: now,
        version: sql`${rooms.version} + 1`,
      })
      .where(and(eq(rooms.id, roomId), eq(rooms.currentQueueItemId, expectedCurrentItemId)))
      .returning({ version: rooms.version })
    if (!updatedRoom) throw new Error('Playback advancement lost the locked current item')

    return {
      code: 'ok',
      transition: {
        roomId,
        version: updatedRoom.version,
        playback: {
          state: promoted ? 'playing' : 'idle',
          currentItemId: promoted?.id ?? null,
          positionSeconds: promoted ? 0 : positionSeconds,
        },
        previousItem: { id: finished.id, status: outcome },
        ...(promoted ? { currentItem: { id: promoted.id, status: 'current' as const } } : {}),
      },
    }
  })
