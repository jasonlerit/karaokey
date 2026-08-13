import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { guestSessions } from './guest-sessions.schema'
import { rooms } from './rooms.schema'

export const queueItemStatuses = [
  'queued',
  'current',
  'removed',
  'skipped',
  'failed',
  'completed',
] as const
export type QueueItemStatus = (typeof queueItemStatuses)[number]

export const queueItems = pgTable(
  'queue_items',
  {
    id: uuid().primaryKey().defaultRandom(),
    roomId: uuid()
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    requesterGuestId: uuid()
      .notNull()
      .references(() => guestSessions.id, { onDelete: 'restrict' }),
    requesterDisplayName: varchar({ length: 100 }).notNull(),
    idempotencyKey: uuid().notNull(),
    sequence: integer().notNull(),
    positionAtAddition: integer().notNull(),
    videoId: varchar({ length: 11 }).notNull(),
    videoTitle: varchar({ length: 500 }).notNull(),
    videoChannel: varchar({ length: 255 }).notNull(),
    videoThumbnailUrl: varchar({ length: 2_048 }).notNull(),
    videoDurationSeconds: integer(),
    status: varchar({ length: 16 }).$type<QueueItemStatus>().default('queued').notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    startedAt: timestamp({ withTimezone: true }),
    endedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex('queue_items_room_sequence_unique').on(table.roomId, table.sequence),
    uniqueIndex('queue_items_guest_idempotency_unique').on(
      table.requesterGuestId,
      table.idempotencyKey,
    ),
    index('queue_items_active_room_sequence_idx')
      .on(table.roomId, table.sequence)
      .where(sql`${table.status} in ('queued', 'current')`),
    index('queue_items_active_guest_idx')
      .on(table.roomId, table.requesterGuestId)
      .where(sql`${table.status} in ('queued', 'current')`),
    check('queue_items_sequence_check', sql`${table.sequence} > 0`),
    check('queue_items_position_at_addition_check', sql`${table.positionAtAddition} > 0`),
    check(
      'queue_items_duration_check',
      sql`${table.videoDurationSeconds} is null or ${table.videoDurationSeconds} >= 0`,
    ),
    check(
      'queue_items_status_check',
      sql`${table.status} in ('queued', 'current', 'removed', 'skipped', 'failed', 'completed')`,
    ),
  ],
)

export type QueueItem = typeof queueItems.$inferSelect
