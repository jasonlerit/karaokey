import 'server-only'

import { and, asc, count, eq, inArray, max, sql } from 'drizzle-orm'

import {
  getQueuePolicyRejection,
  getQueueRemovalPolicyRejection,
  type QueuePolicyCode,
} from '@/common/queue-policy'
import { db } from '@/db'
import { queueItems, rooms, type QueueItem } from '@/db/schemas'
import type { YouTubeVideo } from '@/lib/youtube'

const activeStatuses = ['queued', 'current'] as const

export type QueueItemView = {
  id: string
  sequence: number
  position: number
  status: QueueItem['status']
  video: {
    videoId: string
    title: string
    channel: string
    thumbnailUrl: string
    durationSeconds?: number
  }
  requester: { guestId: string; displayName: string }
  createdAt: string
}

export type AddQueueItemResult =
  | { code: 'ok'; item: QueueItemView; replayed: boolean }
  | {
      code: QueuePolicyCode | 'not_found' | 'room_ended' | 'room_expired' | 'invalid_session'
    }

export type RemoveQueueItemResult =
  { code: 'ok'; item: QueueItemView } | { code: 'not_found' | 'not_owner' | 'not_queued' }

const toQueueItemView = (item: QueueItem, position: number): QueueItemView => ({
  id: item.id,
  sequence: item.sequence,
  position,
  status: item.status,
  video: {
    videoId: item.videoId,
    title: item.videoTitle,
    channel: item.videoChannel,
    thumbnailUrl: item.videoThumbnailUrl,
    ...(item.videoDurationSeconds === null ? {} : { durationSeconds: item.videoDurationSeconds }),
  },
  requester: {
    guestId: item.requesterGuestId,
    displayName: item.requesterDisplayName,
  },
  createdAt: item.createdAt.toISOString(),
})

export const addQueueItem = async ({
  roomId,
  guestId,
  guestDisplayName,
  idempotencyKey,
  video,
  now = new Date(),
}: {
  roomId: string
  guestId: string
  guestDisplayName: string
  idempotencyKey: string
  video: YouTubeVideo
  now?: Date
}): Promise<AddQueueItemResult> =>
  db.transaction(async (tx) => {
    const [room] = await tx.select().from(rooms).where(eq(rooms.id, roomId)).for('update')

    if (!room) return { code: 'not_found' }

    const existing = await tx.query.queueItems.findFirst({
      where: and(
        eq(queueItems.requesterGuestId, guestId),
        eq(queueItems.idempotencyKey, idempotencyKey),
      ),
    })
    if (existing) {
      return {
        code: 'ok',
        item: toQueueItemView(existing, existing.positionAtAddition),
        replayed: true,
      }
    }

    if (room.status === 'ended') return { code: 'room_ended' }
    if (room.status === 'expired' || room.expiresAt <= now || room.absoluteExpiresAt <= now) {
      if (room.status === 'active') {
        await tx
          .update(rooms)
          .set({
            status: 'expired',
            playbackState: 'idle',
            expiredAt: now,
            version: sql`${rooms.version} + 1`,
          })
          .where(eq(rooms.id, roomId))
      }
      return { code: 'room_expired' }
    }

    const [[{ roomUpcomingCount }], [{ guestUpcomingCount }], duplicate] = await Promise.all([
      tx
        .select({ roomUpcomingCount: count() })
        .from(queueItems)
        .where(and(eq(queueItems.roomId, roomId), eq(queueItems.status, 'queued'))),
      tx
        .select({ guestUpcomingCount: count() })
        .from(queueItems)
        .where(
          and(
            eq(queueItems.roomId, roomId),
            eq(queueItems.requesterGuestId, guestId),
            eq(queueItems.status, 'queued'),
          ),
        ),
      tx.query.queueItems.findFirst({
        where: and(
          eq(queueItems.roomId, roomId),
          eq(queueItems.requesterGuestId, guestId),
          eq(queueItems.videoId, video.videoId),
          inArray(queueItems.status, activeStatuses),
        ),
        columns: { id: true },
      }),
    ])

    const rejection = getQueuePolicyRejection({
      guestUpcomingCount,
      roomUpcomingCount,
      hasActiveDuplicate: Boolean(duplicate),
    })
    if (rejection) return { code: rejection }

    const [{ lastSequence }] = await tx
      .select({ lastSequence: max(queueItems.sequence) })
      .from(queueItems)
      .where(eq(queueItems.roomId, roomId))
    const sequence = (lastSequence ?? 0) + 1
    const [created] = await tx
      .insert(queueItems)
      .values({
        roomId,
        requesterGuestId: guestId,
        requesterDisplayName: guestDisplayName,
        idempotencyKey,
        sequence,
        positionAtAddition: roomUpcomingCount + 1,
        videoId: video.videoId,
        videoTitle: video.title,
        videoChannel: video.channel,
        videoThumbnailUrl: video.thumbnailUrl,
        videoDurationSeconds: video.durationSeconds,
        createdAt: now,
      })
      .returning()
    if (!created) throw new Error('Queue insertion did not return an item')

    await tx
      .update(rooms)
      .set({ version: sql`${rooms.version} + 1`, lastActiveAt: now })
      .where(eq(rooms.id, roomId))

    return {
      code: 'ok',
      item: toQueueItemView(created, roomUpcomingCount + 1),
      replayed: false,
    }
  })

export const getQueueItemByIdempotencyKey = async (
  guestId: string,
  idempotencyKey: string,
): Promise<QueueItemView | undefined> => {
  const item = await db.query.queueItems.findFirst({
    where: and(
      eq(queueItems.requesterGuestId, guestId),
      eq(queueItems.idempotencyKey, idempotencyKey),
    ),
  })
  return item ? toQueueItemView(item, item.positionAtAddition) : undefined
}

export const removeQueueItem = async ({
  roomId,
  itemId,
  guestId,
  now = new Date(),
}: {
  roomId: string
  itemId: string
  guestId: string
  now?: Date
}): Promise<RemoveQueueItemResult> =>
  db.transaction(async (tx) => {
    const [room] = await tx
      .select({ id: rooms.id })
      .from(rooms)
      .where(eq(rooms.id, roomId))
      .for('update')
    if (!room) return { code: 'not_found' }

    const [item] = await tx
      .select()
      .from(queueItems)
      .where(and(eq(queueItems.id, itemId), eq(queueItems.roomId, roomId)))
      .for('update')

    if (!item) return { code: 'not_found' }

    const rejection = getQueueRemovalPolicyRejection({
      requesterGuestId: item.requesterGuestId,
      guestId,
      status: item.status,
    })
    if (rejection) return { code: rejection }

    const [removed] = await tx
      .update(queueItems)
      .set({ status: 'removed', endedAt: now })
      .where(and(eq(queueItems.id, itemId), eq(queueItems.status, 'queued')))
      .returning()

    if (!removed) return { code: 'not_queued' }

    await tx
      .update(rooms)
      .set({ version: sql`${rooms.version} + 1`, lastActiveAt: now })
      .where(eq(rooms.id, roomId))

    return { code: 'ok', item: toQueueItemView(removed, removed.positionAtAddition) }
  })

export const getActiveQueue = async (roomId: string): Promise<QueueItemView[]> => {
  const items = await db
    .select()
    .from(queueItems)
    .where(and(eq(queueItems.roomId, roomId), inArray(queueItems.status, activeStatuses)))
    .orderBy(asc(queueItems.sequence))

  let upcomingPosition = 0
  return items.map((item) => {
    if (item.status === 'queued') upcomingPosition += 1
    return toQueueItemView(item, item.status === 'queued' ? upcomingPosition : 0)
  })
}
