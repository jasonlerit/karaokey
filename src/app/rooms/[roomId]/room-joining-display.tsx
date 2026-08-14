'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Link2, QrCode, Smartphone } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

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
  return (
    <section
      className='flex items-center justify-between gap-3 rounded-2xl border border-border p-3 min-[60rem]:p-2'
      aria-labelledby='joining-title'
    >
      <div className='min-w-0'>
        <h2 id='joining-title' className='text-base font-semibold min-[60rem]:text-sm'>
          Invite singers
        </h2>
        <p className='mt-1 text-sm text-muted-foreground min-[60rem]:text-xs'>
          Room <span className='font-semibold tracking-[0.12em] text-foreground'>{roomCode}</span>
        </p>
      </div>

      <Dialog>
        <DialogTrigger
          render={<Button type='button' variant='outline' className='h-11 shrink-0' />}
        >
          <QrCode aria-hidden='true' /> <span className='min-[60rem]:sr-only'>Show QR code</span>
        </DialogTrigger>
        <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl sm:gap-3 sm:p-3'>
          <DialogHeader>
            <DialogTitle className='text-xl'>Invite singers</DialogTitle>
            <DialogDescription>
              Scan the QR code to join room {roomCode}. No account required.
            </DialogDescription>
          </DialogHeader>

          <div className='flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-3'>
            <div className='w-full max-w-80 shrink-0 rounded-xl bg-white p-3 shadow-sm sm:max-w-48 sm:p-2'>
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

            <div className='flex w-full min-w-0 flex-col items-center gap-4 sm:items-stretch sm:gap-2.5'>
              <div className='text-center sm:text-left'>
                <p className='text-sm font-medium tracking-widest text-muted-foreground uppercase'>
                  Room code
                </p>
                <p className='mt-1 text-2xl font-semibold tracking-[0.18em]'>{roomCode}</p>
              </div>

              <ol className='flex flex-col gap-1.5 text-sm leading-5'>
                <li className='flex items-center gap-3'>
                  <QrCode aria-hidden='true' className='size-5 shrink-0 text-primary' />
                  Scan the QR code with a phone camera.
                </li>
                <li className='flex items-center gap-3'>
                  <Smartphone aria-hidden='true' className='size-5 shrink-0 text-primary' />
                  Open the link and choose a display name.
                </li>
              </ol>

              <Card size='sm' className='w-full text-left'>
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

              <p className='text-center text-xs text-muted-foreground sm:text-left'>
                Anonymous rooms are temporary.{' '}
                <Link href='/privacy' className='underline underline-offset-4'>
                  Privacy notice
                </Link>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
