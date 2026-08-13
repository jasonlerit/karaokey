import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { rooms } from './rooms.schema'

export const guestSessions = pgTable(
  'guest_sessions',
  {
    id: uuid().primaryKey().defaultRandom(),
    roomId: uuid()
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    credentialHash: varchar({ length: 64 }).notNull(),
    displayName: varchar({ length: 100 }).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('guest_sessions_room_id_idx').on(table.roomId)],
)

export type GuestSession = typeof guestSessions.$inferSelect
