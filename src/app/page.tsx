import { Music2 } from 'lucide-react'

import { createRoomAction } from '@/app/actions'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className='flex flex-1 items-center justify-center px-6 py-16'>
      <section className='mx-auto flex max-w-xl flex-col items-center text-center'>
        <div className='mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground'>
          <Music2 aria-hidden='true' className='size-7' />
        </div>
        <p className='mb-3 text-sm font-medium tracking-widest text-muted-foreground uppercase'>
          Karaoke, together
        </p>
        <h1 className='text-4xl font-semibold tracking-tight text-foreground sm:text-6xl'>
          Your room. Their requests. One queue.
        </h1>
        <p className='mt-5 max-w-md text-base leading-7 text-muted-foreground sm:text-lg'>
          Start an anonymous karaoke room on this screen. Guests will join from their phones—no
          accounts required.
        </p>
        <form action={createRoomAction} className='mt-8'>
          <Button size='lg' type='submit' className='min-w-40'>
            Create room
          </Button>
        </form>
      </section>
    </main>
  )
}
