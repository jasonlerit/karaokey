export const shouldAutomaticallyStartPlayback = ({
  roomStatus,
  currentItemId,
  firstQueuedItemId,
  lastAttemptedItemId,
}: {
  roomStatus: string
  currentItemId?: string
  firstQueuedItemId?: string
  lastAttemptedItemId?: string
}) =>
  roomStatus === 'active' &&
  !currentItemId &&
  Boolean(firstQueuedItemId) &&
  firstQueuedItemId !== lastAttemptedItemId
