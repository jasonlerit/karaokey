import { timingSafeEqual } from 'node:crypto'

import { env } from '@/common/env'
import { cleanupExpiredRoomData } from '@/common/rooms'

export const dynamic = 'force-dynamic'

const secretsMatch = (provided: string, expected: string) => {
  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(expected)
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  )
}

export async function POST(request: Request) {
  const expected = env.RETENTION_CLEANUP_SECRET
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!expected) return Response.json({ code: 'not_configured' }, { status: 503 })
  if (!provided || !secretsMatch(provided, expected)) {
    return Response.json({ code: 'unauthorized' }, { status: 401 })
  }

  try {
    const deleted = await cleanupExpiredRoomData()
    return Response.json({ deletedRoomCount: deleted.length })
  } catch {
    return Response.json({ code: 'unavailable' }, { status: 503 })
  }
}
