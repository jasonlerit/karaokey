import Link from 'next/link'
import { DoorOpen, Music2 } from 'lucide-react'
import { z } from 'zod'

import { getGuestRoomCredential } from '@/common/guest-session-cookie'
import { restoreGuestSession } from '@/common/guest-sessions'
import { getRoomByJoinToken, type RoomAccessResult } from '@/common/rooms'
import { Button } from '@/components/ui/button'

import { JoinRoomForm } from './join-room-form'

const joinTokenSchema = z
  .string()
  .min(40)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/)

type RoomError = Exclude<RoomAccessResult, { code: 'ok' }> | { code: 'unavailable' }

const RoomMessage = ({ result }: { result: RoomError }) => {
  const content = {
    room_expired: {
      title: 'Room expired',
      description: 'This room reached its time limit and can no longer accept guests.',
    },
    room_ended: {
      title: 'Room ended',
      description: 'The host ended this room, so it can no longer accept guests.',
    },
    not_found: {
      title: 'Room not found',
      description: 'Check the link with your host or return home to create a new room.',
    },
    invalid_host_credential: {
      title: 'Room not found',
      description: 'Check the link with your host or return home to create a new room.',
    },
    unavailable: {
      title: 'Room unavailable',
      description: 'We could not reach this room. Please try again in a moment.',
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

export default async function JoinRoomPage({ params }: { params: Promise<{ joinToken: string }> }) {
  const { joinToken } = await params
  const parsedToken = joinTokenSchema.safeParse(joinToken)
  if (!parsedToken.success) return <RoomMessage result={{ code: 'not_found' }} />

  let roomAccess
  try {
    roomAccess = await getRoomByJoinToken(parsedToken.data)
  } catch {
    return <RoomMessage result={{ code: 'unavailable' }} />
  }

  if (roomAccess.code !== 'ok') return <RoomMessage result={roomAccess} />

  const credential = await getGuestRoomCredential(roomAccess.room.id)
  const restored = credential
    ? await restoreGuestSession(parsedToken.data, credential).catch(
        () => ({ code: 'invalid_session' }) as const,
      )
    : ({ code: 'invalid_session' } as const)

  if (restored.code === 'ok') {
    return (
      <main className='flex flex-1 items-center justify-center px-6 py-16'>
        <section className='w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm'>
          <Music2 aria-hidden='true' className='mx-auto mb-5 size-10 text-primary' />
          <p className='text-sm font-medium tracking-widest text-muted-foreground uppercase'>
            Room {roomAccess.room.roomCode}
          </p>
          <h1 className='mt-2 text-2xl font-semibold'>
            Welcome back, {restored.guest.displayName}
          </h1>
          <p className='mt-3 leading-6 text-muted-foreground'>
            Your guest session is active. Song search and the shared queue arrive in the next phase.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className='flex flex-1 items-center justify-center px-6 py-16'>
      <section className='w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm'>
        <Music2 aria-hidden='true' className='mx-auto mb-5 size-10 text-primary' />
        <p className='text-sm font-medium tracking-widest text-muted-foreground uppercase'>
          Room {roomAccess.room.roomCode}
        </p>
        <h1 className='mt-2 text-2xl font-semibold'>Join the room</h1>
        <p className='mt-3 leading-6 text-muted-foreground'>
          Choose a temporary name for this karaoke session. No account or contact details needed.
        </p>
        <JoinRoomForm joinToken={parsedToken.data} />
      </section>
    </main>
  )
}
