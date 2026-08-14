'use client'

import { LoaderCircle } from 'lucide-react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'

export function CreateRoomButton() {
  const { pending } = useFormStatus()

  return (
    <Button size='lg' type='submit' className='min-w-40' disabled={pending}>
      {pending ? <LoaderCircle aria-hidden='true' className='animate-spin' /> : null}
      {pending ? 'Creating room…' : 'Create room'}
    </Button>
  )
}
