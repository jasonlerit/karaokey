'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'

type EndRoomControlProps = {
  action: () => Promise<void>
}

export const EndRoomControl = ({ action }: EndRoomControlProps) => {
  const [isConfirming, setIsConfirming] = useState(false)

  if (!isConfirming) {
    return (
      <Button type='button' variant='destructive' onClick={() => setIsConfirming(true)}>
        End room
      </Button>
    )
  }

  return (
    <div className='flex flex-col items-end gap-3'>
      <p role='alert' className='text-sm text-muted-foreground'>
        End this room for everyone?
      </p>
      <div className='flex gap-2'>
        <Button type='button' variant='outline' onClick={() => setIsConfirming(false)}>
          Cancel
        </Button>
        <form action={action}>
          <Button type='submit' variant='destructive'>
            Confirm end room
          </Button>
        </form>
      </div>
    </div>
  )
}
