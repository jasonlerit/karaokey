import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy notice — Karaokey',
  description: 'How Karaokey handles temporary room and guest data.',
}

export default function PrivacyPage() {
  return (
    <main className='mx-auto w-full max-w-3xl flex-1 px-6 py-12'>
      <h1 className='text-3xl font-semibold tracking-tight'>Privacy notice</h1>
      <p className='mt-3 text-sm text-muted-foreground'>Last updated August 14, 2026</p>

      <div className='mt-8 space-y-8 leading-7'>
        <section>
          <h2 className='text-xl font-semibold'>Anonymous, temporary sessions</h2>
          <p className='mt-2 text-muted-foreground'>
            Karaokey does not require an account, email address, phone number, or social profile.
            Guests choose a temporary display name that applies only inside one room.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Data used for a room</h2>
          <p className='mt-2 text-muted-foreground'>
            The service stores a room identifier and status, a hashed host credential, temporary
            guest sessions and display names, YouTube video identifiers and display metadata, queue
            order and status, playback state, and lifecycle timestamps. Secret room tokens and
            credentials are stored in protected browser cookies or as one-way hashes where possible.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>YouTube processing</h2>
          <p className='mt-2 text-muted-foreground'>
            Song searches are sent to the YouTube Data API, and the host screen loads YouTube&apos;s
            official embedded player. YouTube may receive technical information such as the host
            device&apos;s IP address and browser details under Google&apos;s own privacy terms.
            Karaokey does not download or host YouTube videos.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Retention and operational logs</h2>
          <p className='mt-2 text-muted-foreground'>
            Ended and expired room data, including its guest sessions and queue, is deleted within
            24 hours when the configured cleanup job runs. Ordinary application logs are limited to
            operational categories and errors and must not include raw host credentials, full guest
            links, or guest-entered names. Infrastructure providers may retain basic request
            metadata according to the operator&apos;s configured log policy.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Abuse protection</h2>
          <p className='mt-2 text-muted-foreground'>
            Short-lived, hashed rate-limit identifiers help restrict room creation, joining,
            searching, and queue mutations. Hosts can remove requests or end a compromised room.
            Karaokey does not use these identifiers to build durable guest profiles or cross-room
            reputation.
          </p>
        </section>
      </div>

      <Link href='/' className='mt-10 inline-block underline underline-offset-4'>
        Return home
      </Link>
    </main>
  )
}
