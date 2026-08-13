export const ROOM_DATA_RETENTION_MS = 24 * 60 * 60 * 1_000

export const getRoomRetentionCutoff = (now: Date) =>
  new Date(now.getTime() - ROOM_DATA_RETENTION_MS)
