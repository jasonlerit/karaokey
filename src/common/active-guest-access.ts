import 'server-only'

import { getGuestRoomCredential } from '@/common/guest-session-cookie'
import { getGuestSessionByRoomId } from '@/common/guest-sessions'
import { getRoomSnapshot } from '@/common/room-sync'

export const hasActiveGuestAccess = async (roomId: string) => {
  const credential = await getGuestRoomCredential(roomId)
  const guest = await getGuestSessionByRoomId(roomId, credential)
  if (guest.code !== 'ok') return false

  const snapshot = await getRoomSnapshot(roomId, 'guest')
  return snapshot?.status === 'active'
}
