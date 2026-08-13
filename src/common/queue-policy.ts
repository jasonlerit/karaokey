export const MAX_UPCOMING_ITEMS_PER_GUEST = 3
export const MAX_UPCOMING_ITEMS_PER_ROOM = 50

export type QueuePolicyCode = 'guest_limit_reached' | 'room_limit_reached' | 'duplicate_video'

export type QueueRemovalPolicyCode = 'not_owner' | 'not_queued'

export const getQueueRemovalPolicyRejection = ({
  requesterGuestId,
  guestId,
  status,
}: {
  requesterGuestId: string
  guestId: string
  status: 'queued' | 'current' | 'removed' | 'skipped' | 'failed' | 'completed'
}): QueueRemovalPolicyCode | undefined => {
  if (requesterGuestId !== guestId) return 'not_owner'
  if (status !== 'queued') return 'not_queued'
}

export const getHostQueueRemovalPolicyRejection = (
  status: 'queued' | 'current' | 'removed' | 'skipped' | 'failed' | 'completed',
): 'not_queued' | undefined => (status === 'queued' ? undefined : 'not_queued')

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
