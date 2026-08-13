import Link from 'next/link'
import { Clock3, DoorOpen, KeyRound, Music2 } from 'lucide-react'
import { z } from 'zod'

import { endRoomAction } from '@/app/actions'
import { env } from '@/common/env'
import { getHostCredential, getHostJoinToken } from '@/common/host-room-session'
import { createGuestQrCode } from '@/common/qr-code'
import { getRoomSnapshot } from '@/common/room-sync'
import { getHostRoom, getRoomByJoinToken, type RoomAccessResult } from '@/common/rooms'
import { RoomSyncPanel } from '@/components/shared/room-sync-panel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'

import { EndRoomControl } from './end-room-control'
import { HostPlaybackPanel } from './host-playback-panel'
import { RoomJoiningDisplay } from './room-joining-display'

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
    <main className='flex flex-1 items-center justify-center px-6 py-12'>
      <Card className='w-full max-w-6xl gap-0 py-0 shadow-sm'>
        <CardContent className='p-8 sm:p-12'>
          <div className='flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <div className='mb-4 flex items-center gap-2 text-sm font-medium text-primary'>
                <Music2 aria-hidden='true' className='size-4' />
                Host room
              </div>
              <h1 className='text-3xl font-semibold tracking-tight'>Room {result.room.roomCode}</h1>
              <p className='mt-3 max-w-md leading-6 text-muted-foreground'>
                Your room is active. Keep this tab open while guests join and add songs.
              </p>
            </div>
            <div className='rounded-2xl bg-muted px-6 py-4 text-center'>
              <p className='text-xs font-medium tracking-widest text-muted-foreground uppercase'>
                Room code
              </p>
              <p className='mt-1 text-3xl font-semibold tracking-[0.2em]'>{result.room.roomCode}</p>
            </div>
          </div>

          <div className='mt-8 grid gap-4 border-t border-border pt-8 sm:grid-cols-2'>
            <Card size='sm' className='bg-muted/60 ring-0'>
              <CardContent>
                <KeyRound aria-hidden='true' className='mb-3 size-5 text-muted-foreground' />
                <CardTitle>Host access is saved</CardTitle>
                <CardDescription className='mt-1 leading-5'>
                  Reopen this room in the same browser to restore these controls.
                </CardDescription>
              </CardContent>
            </Card>
            <Card size='sm' className='bg-muted/60 ring-0'>
              <CardContent>
                <Clock3 aria-hidden='true' className='mb-3 size-5 text-muted-foreground' />
                <CardTitle>Temporary by design</CardTitle>
                <CardDescription className='mt-1 leading-5'>
                  Inactive rooms expire after six hours and always close within twelve hours.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <HostPlaybackPanel initialSnapshot={initialSnapshot} />

          {guestUrl && qrCodeDataUrl ? (
            <RoomJoiningDisplay
              guestUrl={guestUrl}
              qrCodeDataUrl={qrCodeDataUrl}
              roomCode={result.room.roomCode}
            />
          ) : null}

          <RoomSyncPanel initialSnapshot={initialSnapshot} showGuests canModerate />

          <div className='mt-8 flex justify-end'>
            <EndRoomControl action={endAction} />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
