import Link from 'next/link'
import { Clock3, DoorOpen, KeyRound, Music2 } from 'lucide-react'
import { z } from 'zod'

import { endRoomAction } from '@/app/actions'
import { env } from '@/common/env'
import { getHostCredential, getHostJoinToken } from '@/common/host-room-session'
import { getHostRoom, getRoomByJoinToken, type RoomAccessResult } from '@/common/rooms'
import { Button } from '@/components/ui/button'

import { EndRoomControl } from './end-room-control'

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
      <section className='max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm'>
        <DoorOpen aria-hidden='true' className='mx-auto mb-5 size-10 text-muted-foreground' />
        <h1 className='text-2xl font-semibold'>{message.title}</h1>
        <p className='mt-3 leading-6 text-muted-foreground'>{message.description}</p>
        <Button render={<Link href='/' />} className='mt-7'>
          Return home
        </Button>
      </section>
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

  const joinToken = await getHostJoinToken(parsedRoomId.data)
  const joinAccess = joinToken ? await getRoomByJoinToken(joinToken) : undefined
  const guestUrl =
    joinToken && joinAccess?.code === 'ok' && joinAccess.room.id === result.room.id
      ? new URL(`/join/${joinToken}`, env.APP_URL).toString()
      : undefined
  const endAction = endRoomAction.bind(null, result.room.id)

  return (
    <main className='flex flex-1 items-center justify-center px-6 py-12'>
      <section className='w-full max-w-3xl rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-12'>
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
          <div className='rounded-xl bg-muted/60 p-5'>
            <KeyRound aria-hidden='true' className='mb-3 size-5 text-muted-foreground' />
            <p className='font-medium'>Host access is saved</p>
            <p className='mt-1 text-sm leading-5 text-muted-foreground'>
              Reopen this room in the same browser to restore these controls.
            </p>
          </div>
          <div className='rounded-xl bg-muted/60 p-5'>
            <Clock3 aria-hidden='true' className='mb-3 size-5 text-muted-foreground' />
            <p className='font-medium'>Temporary by design</p>
            <p className='mt-1 text-sm leading-5 text-muted-foreground'>
              Inactive rooms expire after six hours and always close within twelve hours.
            </p>
          </div>
        </div>

        {guestUrl ? (
          <div className='mt-6 rounded-xl border border-border p-5'>
            <p className='text-sm font-medium'>Guest link</p>
            <p className='mt-2 text-sm break-all text-muted-foreground'>{guestUrl}</p>
          </div>
        ) : null}

        <div className='mt-8 flex justify-end'>
          <EndRoomControl action={endAction} />
        </div>
      </section>
    </main>
  )
}
