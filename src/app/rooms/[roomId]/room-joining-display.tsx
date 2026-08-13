'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye, EyeOff, Link2, QrCode, Smartphone } from 'lucide-react'

import type { RoomSnapshot } from '@/common/room-sync-state'
import { roomSnapshotKey } from '@/components/shared/room-sync-panel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'

type RoomJoiningDisplayProps = {
  guestUrl: string
  qrCodeDataUrl: string
  roomCode: string
  initialSnapshot: RoomSnapshot
}

export const RoomJoiningDisplay = ({
  guestUrl,
  qrCodeDataUrl,
  roomCode,
  initialSnapshot,
}: RoomJoiningDisplayProps) => {
  const [visibilityOverride, setVisibilityOverride] = useState<boolean | undefined>(undefined)
  const { data: snapshot } = useQuery({
    queryKey: roomSnapshotKey(initialSnapshot.roomId),
    queryFn: () => Promise.resolve(initialSnapshot),
    initialData: initialSnapshot,
    staleTime: Infinity,
  })
  const isVisible =
    visibilityOverride ?? (snapshot.status === 'active' && snapshot.playback.currentItemId === null)

  return (
    <section className='rounded-2xl border border-border p-4' aria-labelledby='joining-title'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 id='joining-title' className='text-xl font-semibold'>
            Invite singers
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Guests can join from their phones—no account required.
          </p>
        </div>
        <Button
          type='button'
          variant='outline'
          aria-controls='joining-information'
          aria-expanded={isVisible}
          className='h-11'
          onClick={() => setVisibilityOverride(!isVisible)}
        >
          {isVisible ? <EyeOff aria-hidden='true' /> : <Eye aria-hidden='true' />}
          {isVisible ? 'Hide joining info' : 'Show joining info'}
        </Button>
      </div>

      {isVisible ? (
        <div id='joining-information' className='mt-4 space-y-4 rounded-xl bg-muted/40 p-4'>
          <div className='mx-auto w-full max-w-64 rounded-xl bg-white p-3 shadow-sm'>
            <Image
              src={qrCodeDataUrl}
              alt='QR code linking to the guest room'
              width={384}
              height={384}
              unoptimized
              priority
              className='size-full'
            />
          </div>

          <div className='space-y-4 text-center'>
            <div>
              <p className='text-sm font-medium tracking-widest text-muted-foreground uppercase'>
                Room code
              </p>
              <p className='mt-2 text-4xl font-semibold tracking-[0.18em]'>{roomCode}</p>
            </div>

            <ol className='space-y-3 text-base leading-6'>
              <li className='flex items-center justify-center gap-3'>
                <QrCode aria-hidden='true' className='size-5 shrink-0 text-primary' />
                Scan the QR code with a phone camera.
              </li>
              <li className='flex items-center justify-center gap-3'>
                <Smartphone aria-hidden='true' className='size-5 shrink-0 text-primary' />
                Open the link and choose a display name.
              </li>
            </ol>

            <Card size='sm' className='text-left'>
              <CardContent>
                <CardTitle className='flex items-center gap-2'>
                  <Link2 aria-hidden='true' className='size-4' />
                  Guest link
                </CardTitle>
                <CardDescription className='mt-2 break-all'>
                  <a className='underline underline-offset-4' href={guestUrl}>
                    {guestUrl}
                  </a>
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </section>
  )
}
