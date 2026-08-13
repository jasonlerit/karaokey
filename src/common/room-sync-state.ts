export type RoomConnectionState = 'connecting' | 'connected' | 'reconnecting'

export type RoomSnapshot = {
  roomId: string
  version: number
  status: 'active' | 'ended' | 'expired'
  playback: {
    state: 'idle' | 'playing' | 'paused'
    positionSeconds: number
  }
  presence: {
    guestCount: number
    guests?: { id: string; displayName: string }[]
  }
  queue: {
    id: string
    sequence: number
    position: number
    status: 'queued' | 'current' | 'removed' | 'skipped' | 'failed' | 'completed'
    video: {
      videoId: string
      title: string
      channel: string
      thumbnailUrl: string
      durationSeconds?: number
    }
    requester: { guestId: string; displayName: string }
    createdAt: string
  }[]
}

export type RoomSyncMessage = {
  eventId: string
  type: 'snapshot'
  snapshot: RoomSnapshot
}

export const acceptRoomSyncMessage = (
  current: RoomSnapshot | undefined,
  message: RoomSyncMessage,
): RoomSnapshot | undefined => {
  if (message.snapshot.roomId === current?.roomId && message.snapshot.version <= current.version) {
    return current
  }

  return message.snapshot
}

export const getReconnectDelay = (attempt: number) =>
  Math.min(1_000 * 2 ** Math.max(0, attempt), 15_000)
