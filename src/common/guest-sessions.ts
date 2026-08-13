import 'server-only'

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

import { and, eq } from 'drizzle-orm'

import { displayNameSchema } from '@/common/display-name'
import { db } from '@/db'
import { guestSessions, type GuestSession } from '@/db/schemas'

import { getRoomByJoinToken } from './rooms'

const CREDENTIAL_BYTES = 32

export type GuestSessionView = Pick<
  GuestSession,
  'id' | 'roomId' | 'displayName' | 'createdAt' | 'lastSeenAt'
>

export type GuestSessionResult =
  | { code: 'ok'; guest: GuestSessionView; credential?: string }
  | { code: 'invalid_name'; message: string }
  | { code: 'not_found' | 'room_ended' | 'room_expired' | 'invalid_session' }

const hashCredential = (credential: string) =>
  createHash('sha256').update(credential, 'utf8').digest('hex')

const credentialsMatch = (credential: string, expectedHash: string) => {
  const actual = Buffer.from(hashCredential(credential), 'hex')
  const expected = Buffer.from(expectedHash, 'hex')

  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

const toView = (guest: GuestSession): GuestSessionView => ({
  id: guest.id,
  roomId: guest.roomId,
  displayName: guest.displayName,
  createdAt: guest.createdAt,
  lastSeenAt: guest.lastSeenAt,
})

const toGuestRoomError = (
  code: 'not_found' | 'invalid_host_credential' | 'room_ended' | 'room_expired',
): GuestSessionResult => {
  if (code === 'room_ended') return { code: 'room_ended' }
  if (code === 'room_expired') return { code: 'room_expired' }
  return { code: 'not_found' }
}

export const createGuestSession = async (
  joinToken: string,
  displayName: unknown,
  now = new Date(),
): Promise<GuestSessionResult> => {
  const parsedName = displayNameSchema.safeParse(displayName)
  if (!parsedName.success) {
    return { code: 'invalid_name', message: parsedName.error.issues[0]?.message ?? 'Invalid name.' }
  }

  const roomAccess = await getRoomByJoinToken(joinToken, now)
  if (roomAccess.code !== 'ok') return toGuestRoomError(roomAccess.code)

  const secret = randomBytes(CREDENTIAL_BYTES).toString('base64url')
  const [guest] = await db
    .insert(guestSessions)
    .values({
      roomId: roomAccess.room.id,
      credentialHash: hashCredential(secret),
      displayName: parsedName.data,
      createdAt: now,
      lastSeenAt: now,
    })
    .returning()

  if (!guest) throw new Error('Guest session creation did not return a session')

  return { code: 'ok', guest: toView(guest), credential: `${guest.id}.${secret}` }
}

export const restoreGuestSession = async (
  joinToken: string,
  credential: string | undefined,
  now = new Date(),
): Promise<GuestSessionResult> => {
  const roomAccess = await getRoomByJoinToken(joinToken, now)
  if (roomAccess.code !== 'ok') return toGuestRoomError(roomAccess.code)
  if (!credential) return { code: 'invalid_session' }

  const separator = credential.indexOf('.')
  if (separator < 1) return { code: 'invalid_session' }

  const sessionId = credential.slice(0, separator)
  const secret = credential.slice(separator + 1)
  const guest = await db.query.guestSessions.findFirst({
    where: and(eq(guestSessions.id, sessionId), eq(guestSessions.roomId, roomAccess.room.id)),
  })

  if (!guest || !credentialsMatch(secret, guest.credentialHash)) {
    return { code: 'invalid_session' }
  }

  const [updated] = await db
    .update(guestSessions)
    .set({ lastSeenAt: now })
    .where(and(eq(guestSessions.id, guest.id), eq(guestSessions.roomId, roomAccess.room.id)))
    .returning()

  return { code: 'ok', guest: toView(updated ?? guest) }
}
