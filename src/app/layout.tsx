import type { Metadata } from 'next'
import Link from 'next/link'
import { Geist, Geist_Mono } from 'next/font/google'
import type { ReactNode } from 'react'

import { ReactQueryClientProvider } from '@/components/shared/react-query-client-provider'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Karaokey',
  description: 'An anonymous karaoke queue for in-person groups.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className='flex min-h-full flex-col'>
        <ReactQueryClientProvider>{children}</ReactQueryClientProvider>
        <footer className='site-footer px-6 py-5 text-center text-xs text-muted-foreground'>
          Anonymous rooms are temporary.{' '}
          <Link href='/privacy' className='underline underline-offset-4'>
            Privacy notice
          </Link>
        </footer>
      </body>
    </html>
  )
}
