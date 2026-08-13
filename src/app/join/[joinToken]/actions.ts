'use server'

import { redirect } from 'next/navigation'

import { saveGuestRoomSession } from '@/common/guest-session-cookie'
import { createGuestSession } from '@/common/guest-sessions'

export type JoinRoomState = { message: string }

export const joinRoomAction = async (
  joinToken: string,
  _previousState: JoinRoomState,
  formData: FormData,
): Promise<JoinRoomState> => {
  let result

  try {
    result = await createGuestSession(joinToken, formData.get('displayName'))
  } catch {
    return { message: 'The room is temporarily unavailable. Please try again.' }
  }

  if (result.code === 'invalid_name') return { message: result.message }
  if (result.code === 'room_ended') return { message: 'This room has ended.' }
  if (result.code === 'room_expired') return { message: 'This room has expired.' }
  if (result.code !== 'ok' || !result.credential) {
    return { message: 'This room could not be found. Check the link with your host.' }
  }

  await saveGuestRoomSession(result.guest.roomId, result.credential)
  redirect(`/join/${joinToken}`)
}
