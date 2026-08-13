export const MAX_UPCOMING_ITEMS_PER_GUEST = 3
export const MAX_UPCOMING_ITEMS_PER_ROOM = 50

export type QueuePolicyCode = 'guest_limit_reached' | 'room_limit_reached' | 'duplicate_video'

export const getQueuePolicyRejection = ({
  guestUpcomingCount,
  roomUpcomingCount,
  hasActiveDuplicate,
}: {
  guestUpcomingCount: number
  roomUpcomingCount: number
  hasActiveDuplicate: boolean
}): QueuePolicyCode | undefined => {
  if (hasActiveDuplicate) return 'duplicate_video'
  if (guestUpcomingCount >= MAX_UPCOMING_ITEMS_PER_GUEST) return 'guest_limit_reached'
  if (roomUpcomingCount >= MAX_UPCOMING_ITEMS_PER_ROOM) return 'room_limit_reached'
}
