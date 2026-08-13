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

export const roomSnapshotKey = (roomId: string) => ['room-snapshot', roomId] as const

type RoomSyncPanelProps = {
  initialSnapshot: RoomSnapshot
  showGuests?: boolean
  viewerGuestId?: string
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
      className='mt-6 rounded-xl border border-border p-4 text-left'
      aria-labelledby='shared-queue-title'
    >
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-2 text-sm font-medium'>
          <Users aria-hidden='true' className='size-4 text-muted-foreground' />
          {snapshot.presence.guestCount} {snapshot.presence.guestCount === 1 ? 'guest' : 'guests'}{' '}
          joined
        </div>
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <span
            className={`size-2 rounded-full ${connectionState === 'connected' ? 'bg-green-500' : 'bg-amber-500'}`}
          />
          {connectionState === 'connected' ? 'Live' : 'Reconnecting…'}
        </div>
      </div>

      {showGuests && snapshot.presence.guests?.length ? (
        <p className='mt-3 text-sm text-muted-foreground'>
          {snapshot.presence.guests.map((guest) => guest.displayName).join(', ')}
        </p>
      ) : null}

      <div className='mt-4 border-t border-border pt-4'>
        <h2 id='shared-queue-title' className='flex items-center gap-2 text-base font-semibold'>
          <ListMusic aria-hidden='true' className='size-4 text-muted-foreground' />
          Shared queue
        </h2>
        {currentItem ? (
          <div className='mt-3 rounded-lg bg-primary/10 p-3'>
            <p className='flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase'>
              <Music2 aria-hidden='true' className='size-4' /> Now playing
            </p>
            <p className='mt-1 font-medium'>{currentItem.video.title}</p>
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
              <li key={item.id} className='flex min-h-11 items-center gap-3 text-sm'>
                <span className='w-5 shrink-0 text-right text-muted-foreground'>
                  {item.position}.
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='block truncate font-medium'>{item.video.title}</span>
                  <span className='block truncate text-xs text-muted-foreground'>
                    {item.requester.guestId === viewerGuestId
                      ? `${item.requester.displayName} (You)`
                      : item.requester.displayName}
                  </span>
                </span>
                {item.requester.guestId === viewerGuestId ? (
                  <Button
                    type='button'
                    variant='ghost'
                    className='h-11 px-3 text-destructive'
                    disabled={removal.isPending}
                    onClick={() => removal.mutate(item.id)}
                    aria-label={`Remove ${item.video.title} from the queue`}
                  >
                    <Trash2 aria-hidden='true' />
                    {removal.isPending && removal.variables === item.id ? 'Removing…' : 'Remove'}
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
          Your song was removed from the queue.
        </p>
      ) : null}
      {removal.isError ? (
        <p role='alert' className='mt-3 text-sm text-destructive'>
          {removal.error instanceof QueueRemovalError && removal.error.code === 'not_queued'
            ? 'That song can no longer be removed because its queue state changed.'
            : 'The song could not be removed. Refresh the room and try again.'}
        </p>
      ) : null}
    </section>
  )
}
