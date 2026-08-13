import Link from 'next/link'
import { DoorOpen, Music2 } from 'lucide-react'
import { z } from 'zod'

import { getRoomByJoinToken } from '@/common/rooms'
import { Button } from '@/components/ui/button'

const joinTokenSchema = z
  .string()
  .min(40)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/)

export default async function JoinRoomPage({ params }: { params: Promise<{ joinToken: string }> }) {
  const { joinToken } = await params
  const parsedToken = joinTokenSchema.safeParse(joinToken)
  const result = parsedToken.success
    ? await getRoomByJoinToken(parsedToken.data)
    : ({ code: 'not_found' } as const)

  if (result.code === 'ok') {
    return (
      <main className='flex flex-1 items-center justify-center px-6 py-16'>
        <section className='max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm'>
          <Music2 aria-hidden='true' className='mx-auto mb-5 size-10 text-primary' />
          <p className='text-sm font-medium tracking-widest text-muted-foreground uppercase'>
            Room {result.room.roomCode}
          </p>
          <h1 className='mt-2 text-2xl font-semibold'>This room is active</h1>
          <p className='mt-3 leading-6 text-muted-foreground'>
            Guest name entry and queue access are coming in the next room-foundation feature.
          </p>
        </section>
      </main>
    )
  }

  const isExpired = result.code === 'room_expired'
  const isEnded = result.code === 'room_ended'
  const title = isExpired ? 'Room expired' : isEnded ? 'Room ended' : 'Room not found'
  const description = isExpired
    ? 'This room reached its time limit and can no longer accept guests.'
    : isEnded
      ? 'The host ended this room, so it can no longer accept guests.'
      : 'Check the link with your host or return home to create a new room.'

  return (
    <main className='flex flex-1 items-center justify-center px-6 py-16'>
      <section className='max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm'>
        <DoorOpen aria-hidden='true' className='mx-auto mb-5 size-10 text-muted-foreground' />
        <h1 className='text-2xl font-semibold'>{title}</h1>
        <p className='mt-3 leading-6 text-muted-foreground'>{description}</p>
        <Button render={<Link href='/' />} className='mt-7'>
          Return home
        </Button>
      </section>
    </main>
  )
}
