'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'

import { joinRoomAction, type JoinRoomState } from './actions'

const initialState: JoinRoomState = { message: '' }

export const JoinRoomForm = ({ joinToken }: { joinToken: string }) => {
  const action = joinRoomAction.bind(null, joinToken)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className='mt-7 text-left'>
      <label htmlFor='displayName' className='text-sm font-medium'>
        Display name
      </label>
      <input
        id='displayName'
        name='displayName'
        type='text'
        required
        autoComplete='nickname'
        enterKeyHint='go'
        maxLength={100}
        aria-describedby='display-name-help display-name-error'
        className='mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30'
        placeholder='How should we call you?'
      />
      <p id='display-name-help' className='mt-2 text-sm text-muted-foreground'>
        Use 1–24 visible characters. Emoji are welcome.
      </p>
      <p
        id='display-name-error'
        aria-live='polite'
        className='mt-2 min-h-5 text-sm text-destructive'
      >
        {state.message}
      </p>
      <Button type='submit' disabled={pending} className='mt-3 w-full'>
        {pending ? 'Joining…' : 'Join room'}
      </Button>
    </form>
  )
}
