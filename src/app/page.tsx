import Link from 'next/link'
import { Music2 } from 'lucide-react'

import { createRoomAction } from '@/app/actions'
import { CreateRoomButton } from '@/app/create-room-button'

const GitHubIcon = () => (
  <svg aria-hidden='true' viewBox='0 0 24 24' className='size-5' fill='currentColor'>
    <path d='M12 .7a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11.1 11.1 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.8 5.4-5.5 5.7.4.4.8 1.1.8 2.1v3.1c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .7Z' />
  </svg>
)

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; retryAfter?: string }>
}) {
  const parameters = await searchParams
  return (
    <main className='flex flex-1 flex-col px-6'>
      <nav
        className='mx-auto flex w-full max-w-6xl items-center justify-between py-5'
        aria-label='Primary navigation'
      >
        <Link
          href='/'
          className='flex items-center gap-2 rounded-md text-lg font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4'
        >
          <span className='flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground'>
            <Music2 aria-hidden='true' className='size-5' />
          </span>
          Karaokey
        </Link>
        <a
          href='https://github.com/jasonlerit/karaokey'
          target='_blank'
          rel='noopener noreferrer'
          aria-label='View Karaokey on GitHub (opens in a new tab)'
          className='flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2'
        >
          <GitHubIcon />
        </a>
      </nav>

      <section className='mx-auto flex max-w-xl flex-1 flex-col items-center justify-center py-12 text-center sm:py-16'>
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
          <CreateRoomButton />
        </form>
        {parameters.error === 'rate_limited' ? (
          <p role='alert' className='mt-4 text-sm text-destructive'>
            Too many rooms were created from this client. Try again in{' '}
            {parameters.retryAfter ?? 'a few'} seconds.
          </p>
        ) : null}
      </section>
    </main>
  )
}
