import { sql } from 'drizzle-orm'
import { check, integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

export const roomStatuses = ['active', 'ended', 'expired'] as const
export type RoomStatus = (typeof roomStatuses)[number]

export const playbackStates = ['idle', 'playing', 'paused'] as const
export type PlaybackState = (typeof playbackStates)[number]

export const rooms = pgTable(
  'rooms',
  {
    id: uuid().primaryKey().defaultRandom(),
    roomCode: varchar({ length: 8 }).notNull(),
    joinTokenHash: varchar({ length: 64 }).notNull(),
    hostCredentialHash: varchar({ length: 255 }).notNull(),
    status: varchar({ length: 16 }).$type<RoomStatus>().default('active').notNull(),
    currentQueueItemId: uuid(),
    playbackState: varchar({ length: 16 }).$type<PlaybackState>().default('idle').notNull(),
    version: integer().default(1).notNull(),
    lastKnownPlaybackPositionSeconds: integer().default(0).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    lastActiveAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    absoluteExpiresAt: timestamp({ withTimezone: true }).notNull(),
    endedAt: timestamp({ withTimezone: true }),
    expiredAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex('rooms_room_code_unique').on(table.roomCode),
    uniqueIndex('rooms_join_token_hash_unique').on(table.joinTokenHash),
    check('rooms_status_check', sql`${table.status} in ('active', 'ended', 'expired')`),
    check(
      'rooms_playback_state_check',
      sql`${table.playbackState} in ('idle', 'playing', 'paused')`,
    ),
    check('rooms_playback_position_check', sql`${table.lastKnownPlaybackPositionSeconds} >= 0`),
    check('rooms_version_check', sql`${table.version} > 0`),
    check('rooms_expiration_order_check', sql`${table.expiresAt} <= ${table.absoluteExpiresAt}`),
  ],
)

export type Room = typeof rooms.$inferSelect
