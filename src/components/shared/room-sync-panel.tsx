'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleAlert, Users } from 'lucide-react'

import {
  acceptRoomSyncMessage,
  getReconnectDelay,
  type RoomConnectionState,
  type RoomSnapshot,
  type RoomSyncMessage,
} from '@/common/room-sync-state'

const roomSnapshotKey = (roomId: string) => ['room-snapshot', roomId] as const

type RoomSyncPanelProps = {
  initialSnapshot: RoomSnapshot
  showGuests?: boolean
}

export const RoomSyncPanel = ({ initialSnapshot, showGuests = false }: RoomSyncPanelProps) => {
  const queryClient = useQueryClient()
  const [connectionState, setConnectionState] = useState<RoomConnectionState>('connecting')
  const reconnectAttempt = useRef(0)
  const { data: snapshot } = useQuery({
    queryKey: roomSnapshotKey(initialSnapshot.roomId),
    queryFn: () => Promise.resolve(initialSnapshot),
    initialData: initialSnapshot,
    staleTime: Infinity,
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

  return (
    <div className='mt-6 rounded-xl border border-border p-4 text-left' aria-live='polite'>
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

      {snapshot.status !== 'active' ? (
        <p className='mt-3 flex items-center gap-2 text-sm font-medium text-destructive'>
          <CircleAlert aria-hidden='true' className='size-4' />
          This room has {snapshot.status}.
        </p>
      ) : null}
    </div>
  )
}
