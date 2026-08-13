'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Eye, EyeOff, Link2, QrCode, Smartphone } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'

type RoomJoiningDisplayProps = {
  guestUrl: string
  qrCodeDataUrl: string
  roomCode: string
}

export const RoomJoiningDisplay = ({
  guestUrl,
  qrCodeDataUrl,
  roomCode,
}: RoomJoiningDisplayProps) => {
  const [isVisible, setIsVisible] = useState(true)

  return (
    <section className='mt-8' aria-labelledby='joining-title'>
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
          onClick={() => setIsVisible((visible) => !visible)}
        >
          {isVisible ? <EyeOff aria-hidden='true' /> : <Eye aria-hidden='true' />}
          {isVisible ? 'Hide joining info' : 'Show joining info'}
        </Button>
      </div>

      {isVisible ? (
        <div
          id='joining-information'
          className='mt-5 grid items-center gap-8 rounded-3xl border border-border bg-muted/40 p-6 md:grid-cols-[minmax(17rem,24rem)_1fr] md:p-8'
        >
          <div className='mx-auto w-full max-w-96 rounded-2xl bg-white p-4 shadow-sm'>
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

          <div className='space-y-5 text-center md:text-left'>
            <div>
              <p className='text-sm font-medium tracking-widest text-muted-foreground uppercase'>
                Room code
              </p>
              <p className='mt-2 text-5xl font-semibold tracking-[0.18em] sm:text-6xl'>
                {roomCode}
              </p>
            </div>

            <ol className='space-y-3 text-base leading-6'>
              <li className='flex items-center justify-center gap-3 md:justify-start'>
                <QrCode aria-hidden='true' className='size-5 shrink-0 text-primary' />
                Scan the QR code with a phone camera.
              </li>
              <li className='flex items-center justify-center gap-3 md:justify-start'>
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
