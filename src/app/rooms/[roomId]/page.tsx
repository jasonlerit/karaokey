import Link from 'next/link'
import { DoorOpen } from 'lucide-react'
import { z } from 'zod'

import { endRoomAction } from '@/app/actions'
import { env } from '@/common/env'
import { getHostCredential, getHostJoinToken } from '@/common/host-room-session'
import { createGuestQrCode } from '@/common/qr-code'
import { getRoomSnapshot } from '@/common/room-sync'
import { getHostRoom, getRoomByJoinToken, type RoomAccessResult } from '@/common/rooms'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { HostPlaybackPanel } from './host-playback-panel'

const roomIdSchema = z.uuid()

const RoomMessage = ({ result }: { result: Exclude<RoomAccessResult, { code: 'ok' }> }) => {
  const content = {
    not_found: {
      title: 'Room not found',
      description: 'This room does not exist or its address is invalid.',
    },
    invalid_host_credential: {
      title: 'Host access unavailable',
      description: 'Open this room in the browser that created it to restore the host controls.',
    },
    room_ended: {
      title: 'Room ended',
      description: 'Playback has stopped and this room is closed to new activity.',
    },
    room_expired: {
      title: 'Room expired',
      description: 'This room reached its time limit and is no longer active.',
    },
  } as const
  const message = content[result.code]

  return (
    <main className='flex flex-1 items-center justify-center px-6 py-16'>
      <Card className='w-full max-w-md text-center shadow-sm'>
        <CardContent className='p-4'>
          <DoorOpen aria-hidden='true' className='mx-auto mb-5 size-10 text-muted-foreground' />
          <h1 className='text-2xl font-semibold'>{message.title}</h1>
          <p className='mt-3 leading-6 text-muted-foreground'>{message.description}</p>
          <Button render={<Link href='/' />} className='mt-7'>
            Return home
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

export default async function HostRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const parsedRoomId = roomIdSchema.safeParse(roomId)

  if (!parsedRoomId.success) return <RoomMessage result={{ code: 'not_found' }} />

  const credential = await getHostCredential(parsedRoomId.data)
  const result = await getHostRoom(parsedRoomId.data, credential)

  if (result.code !== 'ok') return <RoomMessage result={result} />

  const initialSnapshot = await getRoomSnapshot(result.room.id, 'host')
  if (!initialSnapshot) return <RoomMessage result={{ code: 'not_found' }} />

  const joinToken = await getHostJoinToken(parsedRoomId.data)
  const joinAccess = joinToken ? await getRoomByJoinToken(joinToken) : undefined
  const guestUrl =
    joinToken && joinAccess?.code === 'ok' && joinAccess.room.id === result.room.id
      ? new URL(`/join/${joinToken}`, env.APP_URL).toString()
      : undefined
  const qrCodeDataUrl = guestUrl ? await createGuestQrCode(guestUrl) : undefined
  const endAction = endRoomAction.bind(null, result.room.id)

  return (
    <main
      data-host-room
      className='min-h-dvh flex-1 p-3 min-[60rem]:h-dvh min-[60rem]:overflow-hidden min-[60rem]:p-0'
    >
      <HostPlaybackPanel
        initialSnapshot={initialSnapshot}
        guestUrl={guestUrl}
        qrCodeDataUrl={qrCodeDataUrl}
        roomCode={result.room.roomCode}
        endAction={endAction}
      />
    </main>
  )
}
