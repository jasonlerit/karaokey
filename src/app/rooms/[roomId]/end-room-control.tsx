'use client'

import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type EndRoomControlProps = {
  action: () => Promise<void>
}

export const EndRoomControl = ({ action }: EndRoomControlProps) => {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button type='button' variant='destructive' className='h-11 min-w-0 px-2.5' />}
      >
        <LogOut aria-hidden='true' /> <span className='min-[60rem]:sr-only'>End room</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>End room?</DialogTitle>
          <DialogDescription>
            Playback will stop and everyone will lose access to this room. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type='button' variant='outline' />}>Cancel</DialogClose>
          <form action={action}>
            <Button type='submit' variant='destructive'>
              End room
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
