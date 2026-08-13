export type PlaybackTransitionCode =
  | 'room_ended'
  | 'room_expired'
  | 'queue_empty'
  | 'already_started'
  | 'stale_current_item'
  | 'invalid_transition'

type RoomPlaybackState = {
  roomStatus: 'active' | 'ended' | 'expired'
  playbackState: 'idle' | 'playing' | 'paused'
  currentItemId: string | null
}

const getRoomRejection = (
  roomStatus: RoomPlaybackState['roomStatus'],
): 'room_ended' | 'room_expired' | undefined => {
  if (roomStatus === 'ended') return 'room_ended'
  if (roomStatus === 'expired') return 'room_expired'
}

export const getStartPlaybackRejection = ({
  roomStatus,
  playbackState,
  currentItemId,
  hasQueuedItem,
}: RoomPlaybackState & { hasQueuedItem: boolean }): PlaybackTransitionCode | undefined => {
  const roomRejection = getRoomRejection(roomStatus)
  if (roomRejection) return roomRejection
  if (playbackState !== 'idle' || currentItemId !== null) return 'already_started'
  if (!hasQueuedItem) return 'queue_empty'
}

export const getAdvancePlaybackRejection = ({
  roomStatus,
  currentItemId,
  expectedCurrentItemId,
  currentItemStatus,
}: Pick<RoomPlaybackState, 'roomStatus' | 'currentItemId'> & {
  expectedCurrentItemId: string
  currentItemStatus?: 'queued' | 'current' | 'removed' | 'skipped' | 'failed' | 'completed'
}): PlaybackTransitionCode | undefined => {
  const roomRejection = getRoomRejection(roomStatus)
  if (roomRejection) return roomRejection
  if (currentItemId !== expectedCurrentItemId) return 'stale_current_item'
  if (currentItemStatus !== 'current') return 'invalid_transition'
}
