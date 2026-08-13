'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleAlert, ListMusic, Music2, Trash2, Users } from 'lucide-react'

import {
  acceptRoomSyncMessage,
  getReconnectDelay,
  type RoomConnectionState,
  type RoomSnapshot,
  type RoomSyncMessage,
} from '@/common/room-sync-state'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const roomSnapshotKey = (roomId: string) => ['room-snapshot', roomId] as const

type RoomSyncPanelProps = {
  initialSnapshot: RoomSnapshot
  showGuests?: boolean
  viewerGuestId?: string
  canModerate?: boolean
  display?: 'default' | 'tv'
}

class QueueRemovalError extends Error {
  constructor(public readonly code: string) {
    super(code)
  }
}

const removeQueueItem = async (roomId: string, itemId: string) => {
  const response = await fetch(`/api/rooms/${roomId}/queue/${itemId}`, { method: 'DELETE' })
  if (!response.ok) {
    const body = (await response.json().catch(() => undefined)) as { code?: string } | undefined
    throw new QueueRemovalError(body?.code ?? 'unavailable')
  }
  return itemId
}

export const RoomSyncPanel = ({
  initialSnapshot,
  showGuests = false,
  viewerGuestId,
  canModerate = false,
  display = 'default',
}: RoomSyncPanelProps) => {
  const queryClient = useQueryClient()
  const [connectionState, setConnectionState] = useState<RoomConnectionState>('connecting')
  const reconnectAttempt = useRef(0)
  const { data: snapshot } = useQuery({
    queryKey: roomSnapshotKey(initialSnapshot.roomId),
    queryFn: () => Promise.resolve(initialSnapshot),
    initialData: initialSnapshot,
    staleTime: Infinity,
  })
  const removal = useMutation({
    mutationFn: (itemId: string) => removeQueueItem(initialSnapshot.roomId, itemId),
    onSuccess: (itemId) => {
      queryClient.setQueryData<RoomSnapshot>(roomSnapshotKey(initialSnapshot.roomId), (current) =>
        current
          ? { ...current, queue: current.queue.filter((item) => item.id !== itemId) }
          : current,
      )
    },
  })

  useEffect(() => {
    let source: EventSource | undefined
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    let stopped = false

    const connect = () => {
      if (stopped) return
      setConnectionState(reconnectAttempt.current === 0 ? 'connecting' : 'reconnecting')
      source = new EventSource(`/api/rooms/${initialSnapshot.roomId}/events`)

      source.onopen = () => {
        reconnectAttempt.current = 0
        setConnectionState('connected')
      }
      source.addEventListener('snapshot', (event) => {
        const message = JSON.parse(event.data) as RoomSyncMessage
        queryClient.setQueryData<RoomSnapshot>(roomSnapshotKey(initialSnapshot.roomId), (current) =>
          acceptRoomSyncMessage(current, message),
        )
      })
      source.onerror = () => {
        source?.close()
        if (stopped) return

        setConnectionState('reconnecting')
        const delay = getReconnectDelay(reconnectAttempt.current)
        reconnectAttempt.current += 1
        reconnectTimer = setTimeout(connect, delay)
      }
    }

    connect()
    return () => {
      stopped = true
      source?.close()
      if (reconnectTimer) clearTimeout(reconnectTimer)
    }
  }, [initialSnapshot.roomId, queryClient])

  const currentItem = snapshot.queue.find((item) => item.status === 'current')
  const upcomingItems = snapshot.queue.filter((item) => item.status === 'queued')

  return (
    <section
      className={cn(
        'rounded-xl border border-border text-left',
        display === 'tv' ? 'p-5' : 'mt-6 p-4',
      )}
      aria-labelledby='shared-queue-title'
    >
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-2 text-sm font-medium'>
          <Users aria-hidden='true' className='size-4 text-muted-foreground' />
          {snapshot.presence.guestCount} {snapshot.presence.guestCount === 1 ? 'guest' : 'guests'}{' '}
          joined
        </div>
        <div
          role='status'
          className='flex items-center gap-2 text-xs font-medium text-muted-foreground'
        >
          <span
            className={cn(
              'size-2 rounded-full',
              connectionState === 'connected'
                ? 'bg-green-500'
                : connectionState === 'connecting'
                  ? 'bg-muted-foreground'
                  : 'bg-amber-500',
            )}
          />
          {connectionState === 'connected'
            ? 'Live'
            : connectionState === 'connecting'
              ? 'Connecting…'
              : 'Offline — retrying…'}
        </div>
      </div>

      {connectionState === 'reconnecting' ? (
        <p role='alert' className='mt-3 text-sm font-medium text-destructive'>
          Queue updates may be delayed. Check this display&apos;s connection; retrying
          automatically.
        </p>
      ) : null}

      {showGuests && snapshot.presence.guests?.length ? (
        <p className='mt-3 text-sm text-muted-foreground'>
          {snapshot.presence.guests.map((guest) => guest.displayName).join(', ')}
        </p>
      ) : null}

      <div className='mt-4 border-t border-border pt-4'>
        <h2
          id='shared-queue-title'
          className={cn(
            'flex items-center gap-2 font-semibold',
            display === 'tv' ? 'text-xl' : 'text-base',
          )}
        >
          <ListMusic aria-hidden='true' className='size-4 text-muted-foreground' />
          Shared queue
        </h2>
        {currentItem ? (
          <div className='mt-3 rounded-lg border border-primary/20 bg-primary/10 p-3'>
            <p className='flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase'>
              <Music2 aria-hidden='true' className='size-4' /> Now playing
            </p>
            <p className={cn('mt-1 font-medium', display === 'tv' && 'text-lg')}>
              {currentItem.video.title}
            </p>
            <p className='mt-0.5 text-sm text-muted-foreground'>
              Requested by{' '}
              {currentItem.requester.guestId === viewerGuestId
                ? 'you'
                : currentItem.requester.displayName}
            </p>
          </div>
        ) : (
          <p className='mt-3 text-sm text-muted-foreground'>Nothing is playing yet.</p>
        )}
        <p className='mt-4 text-sm font-medium'>Up next</p>
        {upcomingItems.length ? (
          <ol className='mt-3 space-y-2'>
            {upcomingItems.map((item) => (
              <li
                key={item.id}
                className={cn(
                  'flex items-center gap-3 text-sm',
                  display === 'tv' ? 'min-h-14' : 'min-h-11',
                )}
              >
                <span className='w-5 shrink-0 text-right font-medium text-muted-foreground'>
                  <span className='sr-only'>Position </span>
                  {item.position}.
                </span>
                <span className='min-w-0 flex-1'>
                  <span
                    className={cn('block truncate font-medium', display === 'tv' && 'text-base')}
                  >
                    {item.video.title}
                  </span>
                  <span className='block truncate text-xs text-muted-foreground'>
                    {item.requester.guestId === viewerGuestId
                      ? `${item.requester.displayName} (You)`
                      : item.requester.displayName}
                  </span>
                </span>
                {snapshot.status === 'active' &&
                (canModerate || item.requester.guestId === viewerGuestId) ? (
                  <Button
                    type='button'
                    variant='ghost'
                    className='h-11 px-3 text-destructive'
                    disabled={removal.isPending}
                    onClick={() => removal.mutate(item.id)}
                    aria-label={`Remove ${item.video.title} from the queue`}
                  >
                    <Trash2 aria-hidden='true' />
                    <span className={cn(canModerate && display === 'tv' && 'sr-only')}>
                      {removal.isPending && removal.variables === item.id ? 'Removing…' : 'Remove'}
                    </span>
                  </Button>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className='mt-2 text-sm text-muted-foreground'>No songs queued yet.</p>
        )}
      </div>

      {snapshot.status !== 'active' ? (
        <p
          role='status'
          className='mt-3 flex items-center gap-2 text-sm font-medium text-destructive'
        >
          <CircleAlert aria-hidden='true' className='size-4' />
          This room has {snapshot.status}.
        </p>
      ) : null}
      {removal.isSuccess ? (
        <p role='status' className='mt-3 text-sm font-medium text-primary'>
          {canModerate
            ? 'The song was removed from the queue.'
            : 'Your song was removed from the queue.'}
        </p>
      ) : null}
      {removal.isError ? (
        <p role='alert' className='mt-3 text-sm text-destructive'>
          {removal.error instanceof QueueRemovalError && removal.error.code === 'not_queued'
            ? 'That song can no longer be removed because its queue state changed.'
            : 'The song could not be removed. Refresh the room and try again.'}
        </p>
      ) : null}
      {snapshot.recentActivity ? (
        <p
          key={snapshot.recentActivity.id}
          aria-live='polite'
          className='mt-3 text-sm text-muted-foreground'
        >
          {snapshot.recentActivity.status === 'removed'
            ? `${snapshot.recentActivity.videoTitle}, requested by ${snapshot.recentActivity.requesterDisplayName}, was removed from the queue.`
            : snapshot.recentActivity.status === 'skipped'
              ? `${snapshot.recentActivity.videoTitle}, requested by ${snapshot.recentActivity.requesterDisplayName}, was skipped.`
              : snapshot.recentActivity.status === 'failed'
                ? `${snapshot.recentActivity.videoTitle} could not be played.`
                : `${snapshot.recentActivity.videoTitle} finished.`}
        </p>
      ) : null}
    </section>
  )
}
