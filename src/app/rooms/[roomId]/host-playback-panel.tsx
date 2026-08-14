'use client'

import Link from 'next/link'
import Script from 'next/script'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  LoaderCircle,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  SkipForward,
  Volume2,
} from 'lucide-react'
import { z } from 'zod'

import type { RoomSnapshot } from '@/common/room-sync-state'
import {
  getPlayerRecoveryAction,
  PLAYER_API_TIMEOUT_MS,
  PLAYER_START_TIMEOUT_MS,
} from '@/common/playback-recovery'
import { getYouTubePlayerAction } from '@/common/youtube-player-state'
import { RoomSyncPanel, roomSnapshotKey } from '@/components/shared/room-sync-panel'
import { Button } from '@/components/ui/button'

import { EndRoomControl } from './end-room-control'
import { RoomJoiningDisplay } from './room-joining-display'

type PlaybackCommand =
  | { action: 'start' }
  | {
      action: 'advance'
      expectedCurrentItemId: string
      outcome: 'completed' | 'skipped' | 'failed'
      positionSeconds: number
    }
  | {
      action: 'synchronize'
      expectedCurrentItemId: string
      state: 'playing' | 'paused'
      positionSeconds: number
    }

type YouTubePlayer = {
  cueVideoById: (options: { videoId: string; startSeconds: number }) => void
  destroy: () => void
  getCurrentTime: () => number
  getPlayerState: () => number
  loadVideoById: (options: { videoId: string; startSeconds: number }) => void
  pauseVideo: () => void
  playVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  setVolume: (volume: number) => void
  stopVideo: () => void
}

type YouTubePlayerOptions = {
  height: string
  width: string
  playerVars: { origin: string; playsinline: 1 }
  events: {
    onReady: () => void
    onStateChange: (event: { data: number }) => void
    onError: (event: { data: number }) => void
    onAutoplayBlocked: () => void
  }
}

declare global {
  interface Window {
    YT?: { Player?: new (elementId: string, options: YouTubePlayerOptions) => YouTubePlayer }
    onYouTubeIframeAPIReady?: () => void
  }
}

class PlaybackCommandError extends Error {
  constructor(public readonly code: string) {
    super(code)
  }
}

const errorSchema = z.object({ code: z.string() })

const sendPlaybackCommand = async (roomId: string, command: PlaybackCommand) => {
  const response = await fetch(`/api/rooms/${roomId}/playback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  if (!response.ok) {
    const parsed = errorSchema.safeParse(await response.json().catch(() => undefined))
    throw new PlaybackCommandError(parsed.success ? parsed.data.code : 'unavailable')
  }
}

const getPosition = (player: YouTubePlayer | null) =>
  Math.max(0, Math.floor(player?.getCurrentTime() ?? 0))

export const HostPlaybackPanel = ({
  initialSnapshot,
  guestUrl,
  qrCodeDataUrl,
  roomCode,
  endAction,
}: {
  initialSnapshot: RoomSnapshot
  guestUrl?: string
  qrCodeDataUrl?: string
  roomCode: string
  endAction: () => Promise<void>
}) => {
  const playerElementId = `youtube-player-${initialSnapshot.roomId}`
  const playerRef = useRef<YouTubePlayer | null>(null)
  const loadedItemIdRef = useRef<string | null>(null)
  const advancedItemIdRef = useRef<string | null>(null)
  const lastReportedStateRef = useRef<string | null>(null)
  const mutationRef = useRef<(command: PlaybackCommand) => void>(() => undefined)
  const volumeRef = useRef(70)
  const apiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recoveryRetryCountRef = useRef(0)
  const videoRequestRef = useRef<{ videoId: string; startSeconds: number } | null>(null)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [needsInteraction, setNeedsInteraction] = useState(false)
  const [recoveryMessage, setRecoveryMessage] = useState<string>()
  const [playerApiUnavailable, setPlayerApiUnavailable] = useState(false)
  const [volume, setVolume] = useState(70)
  const { data: snapshot } = useQuery({
    queryKey: roomSnapshotKey(initialSnapshot.roomId),
    queryFn: () => Promise.resolve(initialSnapshot),
    initialData: initialSnapshot,
    staleTime: Infinity,
  })
  const command = useMutation({
    mutationFn: (value: PlaybackCommand) => sendPlaybackCommand(initialSnapshot.roomId, value),
    onError: (_error, value) => {
      if (value.action === 'advance') advancedItemIdRef.current = null
    },
  })

  useEffect(() => {
    mutationRef.current = command.mutate
  }, [command.mutate])

  const reportPlayerState = useCallback((state: 'playing' | 'paused') => {
    const itemId = loadedItemIdRef.current
    if (!itemId) return
    const positionSeconds = getPosition(playerRef.current)
    const signature = `${itemId}:${state}:${positionSeconds}`
    if (lastReportedStateRef.current === signature) return
    lastReportedStateRef.current = signature
    mutationRef.current({
      action: 'synchronize',
      expectedCurrentItemId: itemId,
      state,
      positionSeconds,
    })
  }, [])

  const advanceLoadedItem = useCallback((outcome: 'completed' | 'failed') => {
    const itemId = loadedItemIdRef.current
    if (!itemId || advancedItemIdRef.current === itemId) return
    advancedItemIdRef.current = itemId
    mutationRef.current({
      action: 'advance',
      expectedCurrentItemId: itemId,
      outcome,
      positionSeconds: getPosition(playerRef.current),
    })
  }, [])

  const clearStartupTimer = useCallback(() => {
    if (startupTimerRef.current) clearTimeout(startupTimerRef.current)
    startupTimerRef.current = null
  }, [])

  const recoverLoadedItem = useCallback(() => {
    clearStartupTimer()
    const itemId = loadedItemIdRef.current
    const videoRequest = videoRequestRef.current
    if (!itemId || !videoRequest || advancedItemIdRef.current === itemId) return

    if (getPlayerRecoveryAction(recoveryRetryCountRef.current) === 'retry') {
      recoveryRetryCountRef.current += 1
      setRecoveryMessage('The video did not start. Retrying once…')
      playerRef.current?.loadVideoById(videoRequest)
      startupTimerRef.current = setTimeout(() => {
        setRecoveryMessage('This video could not be played. Moving to the next request.')
        advanceLoadedItem('failed')
      }, PLAYER_START_TIMEOUT_MS)
      return
    }

    setRecoveryMessage('This video could not be played. Moving to the next request.')
    advanceLoadedItem('failed')
  }, [advanceLoadedItem, clearStartupTimer])

  const initializePlayer = useCallback(() => {
    const Player = window.YT?.Player
    if (playerRef.current || typeof Player !== 'function') return
    playerRef.current = new Player(playerElementId, {
      height: '100%',
      width: '100%',
      playerVars: { origin: window.location.origin, playsinline: 1 },
      events: {
        onReady: () => {
          if (apiTimerRef.current) clearTimeout(apiTimerRef.current)
          apiTimerRef.current = null
          setPlayerApiUnavailable(false)
          playerRef.current?.setVolume(volumeRef.current)
          setIsPlayerReady(true)
        },
        onStateChange: ({ data }) => {
          const action = getYouTubePlayerAction(data)
          if (action === 'playing') {
            clearStartupTimer()
            recoveryRetryCountRef.current = 0
            setRecoveryMessage(undefined)
            setNeedsInteraction(false)
            reportPlayerState('playing')
          } else if (action === 'paused') {
            clearStartupTimer()
            setNeedsInteraction(false)
            reportPlayerState('paused')
          } else if (action === 'completed') {
            clearStartupTimer()
            setNeedsInteraction(false)
            advanceLoadedItem('completed')
          }
        },
        onError: () => recoverLoadedItem(),
        onAutoplayBlocked: () => {
          clearStartupTimer()
          setRecoveryMessage('Your browser blocked autoplay. Start playback when ready.')
          setNeedsInteraction(true)
        },
      },
    })
  }, [advanceLoadedItem, clearStartupTimer, playerElementId, recoverLoadedItem, reportPlayerState])

  useEffect(() => {
    const previousReadyHandler = window.onYouTubeIframeAPIReady
    const readyHandler = () => {
      previousReadyHandler?.()
      initializePlayer()
    }
    window.onYouTubeIframeAPIReady = readyHandler
    const initializationTimer = window.setTimeout(initializePlayer, 0)
    apiTimerRef.current = setTimeout(() => setPlayerApiUnavailable(true), PLAYER_API_TIMEOUT_MS)

    return () => {
      window.clearTimeout(initializationTimer)
      if (apiTimerRef.current) clearTimeout(apiTimerRef.current)
      clearStartupTimer()
      if (window.onYouTubeIframeAPIReady === readyHandler) {
        window.onYouTubeIframeAPIReady = previousReadyHandler
      }
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [clearStartupTimer, initializePlayer])

  const currentItem = snapshot.queue.find(
    (item) => item.id === snapshot.playback.currentItemId && item.status === 'current',
  )
  const hasQueuedItem = snapshot.queue.some((item) => item.status === 'queued')
  const isRoomActive = snapshot.status === 'active'

  useEffect(() => {
    const player = playerRef.current
    if (!player || !isPlayerReady) return

    if (snapshot.status !== 'active' || !currentItem) {
      if (loadedItemIdRef.current) player.stopVideo()
      loadedItemIdRef.current = null
      videoRequestRef.current = null
      clearStartupTimer()
      return
    }

    if (loadedItemIdRef.current !== currentItem.id) {
      loadedItemIdRef.current = currentItem.id
      advancedItemIdRef.current = null
      lastReportedStateRef.current = null
      recoveryRetryCountRef.current = 0
      setRecoveryMessage(undefined)
      const videoRequest = {
        videoId: currentItem.video.videoId,
        startSeconds: snapshot.playback.positionSeconds,
      }
      videoRequestRef.current = videoRequest
      if (snapshot.playback.state === 'paused') {
        player.cueVideoById(videoRequest)
      } else {
        player.loadVideoById(videoRequest)
        startupTimerRef.current = setTimeout(recoverLoadedItem, PLAYER_START_TIMEOUT_MS)
      }
      return
    }

    if (snapshot.playback.state === 'playing' && player.getPlayerState() !== 1) {
      player.playVideo()
    } else if (snapshot.playback.state === 'paused' && player.getPlayerState() !== 2) {
      player.pauseVideo()
    }
  }, [
    currentItem,
    clearStartupTimer,
    isPlayerReady,
    recoverLoadedItem,
    snapshot.playback.positionSeconds,
    snapshot.playback.state,
    snapshot.status,
  ])

  const startOrPlay = () => {
    command.reset()
    if (!currentItem) {
      command.mutate({ action: 'start' })
      return
    }
    clearStartupTimer()
    startupTimerRef.current = setTimeout(recoverLoadedItem, PLAYER_START_TIMEOUT_MS)
    playerRef.current?.playVideo()
  }

  const pause = () => {
    command.reset()
    playerRef.current?.pauseVideo()
  }

  const restart = () => {
    if (!currentItem) return
    command.reset()
    playerRef.current?.seekTo(0, true)
    playerRef.current?.playVideo()
    command.mutate({
      action: 'synchronize',
      expectedCurrentItemId: currentItem.id,
      state: 'playing',
      positionSeconds: 0,
    })
  }

  const skip = () => {
    if (!currentItem) return
    command.reset()
    advancedItemIdRef.current = currentItem.id
    command.mutate({
      action: 'advance',
      expectedCurrentItemId: currentItem.id,
      outcome: 'skipped',
      positionSeconds: getPosition(playerRef.current),
    })
  }

  const errorMessage =
    command.error instanceof PlaybackCommandError && command.error.code === 'stale_current_item'
      ? 'The room already moved to a newer song.'
      : 'Playback could not be updated. Check the connection and try again.'

  return (
    <div className='grid gap-4 min-[60rem]:h-full min-[60rem]:grid-cols-[minmax(0,7fr)_minmax(18rem,3fr)]'>
      <section
        className='min-w-0 min-[60rem]:flex min-[60rem]:items-center'
        aria-label='Karaoke player'
      >
        <Script
          src='https://www.youtube.com/iframe_api'
          strategy='afterInteractive'
          onReady={initializePlayer}
          onError={() => setPlayerApiUnavailable(true)}
        />
        <div className='relative aspect-video w-full min-w-0 overflow-hidden rounded-2xl bg-black'>
          <div id={playerElementId} className='size-full' />
          {!currentItem || !isPlayerReady ? (
            <div className='absolute inset-0 flex items-center justify-center bg-black text-center text-white'>
              <div className='p-6'>
                {currentItem && !isPlayerReady && !playerApiUnavailable ? (
                  <LoaderCircle
                    aria-hidden='true'
                    className='mx-auto size-10 animate-spin opacity-70'
                  />
                ) : (
                  <Play aria-hidden='true' className='mx-auto size-10 opacity-70' />
                )}
                <p className='mt-3 text-lg font-medium'>
                  {snapshot.status === 'ended'
                    ? 'Room ended'
                    : snapshot.status === 'expired'
                      ? 'Room expired'
                      : playerApiUnavailable
                        ? 'YouTube player unavailable'
                        : currentItem && !isPlayerReady
                          ? 'Loading player…'
                          : hasQueuedItem
                            ? 'Ready for the first singer'
                            : 'Waiting for song requests'}
                </p>
                <p className='mt-1 text-sm text-white/70'>
                  {snapshot.status === 'ended'
                    ? 'Playback is stopped and the room is closed.'
                    : snapshot.status === 'expired'
                      ? 'Create a new room to keep singing.'
                      : playerApiUnavailable
                        ? 'Check the connection, then retry the player.'
                        : currentItem && !isPlayerReady
                          ? 'Connecting to the YouTube player.'
                          : hasQueuedItem
                            ? 'Use Start Playback when everyone is ready.'
                            : 'Guests can scan the room QR code to add songs.'}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <aside
        className='flex flex-col gap-3 min-[60rem]:min-h-0 min-[60rem]:overflow-hidden'
        aria-label='Room queue and host actions'
      >
        <section
          className='shrink-0 rounded-2xl border border-border p-2'
          aria-label='Playback controls'
        >
          <div className='flex items-center justify-between gap-2 min-[60rem]:hidden'>
            <h2 id='player-title' className='font-semibold'>
              Playback controls
            </h2>
            <p className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>
              {isRoomActive ? snapshot.playback.state : snapshot.status}
            </p>
          </div>

          {playerApiUnavailable ? (
            <Button
              type='button'
              variant='outline'
              className='mt-2 h-11 w-full'
              onClick={() => window.location.reload()}
            >
              <RefreshCw aria-hidden='true' /> Retry YouTube player
            </Button>
          ) : null}

          {isRoomActive &&
          ((hasQueuedItem && !currentItem) || (currentItem && needsInteraction)) ? (
            <Button
              type='button'
              size='lg'
              className='mt-2 h-11 w-full'
              disabled={command.isPending || (Boolean(currentItem) && !isPlayerReady)}
              onClick={startOrPlay}
            >
              {command.isPending ? (
                <LoaderCircle aria-hidden='true' className='animate-spin' />
              ) : (
                <Play aria-hidden='true' />
              )}
              Start playback
            </Button>
          ) : null}

          <div className='mt-2 flex items-center gap-1.5 min-[60rem]:mt-0'>
            <Button
              type='button'
              variant='outline'
              className='h-11 min-w-0 px-2.5'
              disabled={!isRoomActive || !currentItem || !isPlayerReady || command.isPending}
              onClick={snapshot.playback.state === 'playing' ? pause : startOrPlay}
            >
              {snapshot.playback.state === 'playing' ? (
                <Pause aria-hidden='true' />
              ) : (
                <Play aria-hidden='true' />
              )}
              <span className='min-[60rem]:sr-only'>
                {snapshot.playback.state === 'playing' ? 'Pause' : 'Play'}
              </span>
            </Button>
            <Button
              type='button'
              variant='outline'
              className='h-11 min-w-0 px-2.5'
              disabled={!isRoomActive || !currentItem || !isPlayerReady || command.isPending}
              onClick={restart}
            >
              <RotateCcw aria-hidden='true' /> <span className='min-[60rem]:sr-only'>Restart</span>
            </Button>
            <Button
              type='button'
              variant='outline'
              className='h-11 min-w-0 px-2.5'
              disabled={!isRoomActive || !currentItem || command.isPending}
              onClick={skip}
            >
              <SkipForward aria-hidden='true' /> <span className='min-[60rem]:sr-only'>Skip</span>
            </Button>
            <label className='ml-1 flex min-h-11 min-w-0 flex-1 items-center gap-1.5 text-xs font-medium'>
              <Volume2 aria-hidden='true' className='size-4' />
              <span className='min-[60rem]:sr-only'>Volume</span>
              <input
                type='range'
                min='0'
                max='100'
                value={volume}
                disabled={!isPlayerReady}
                onChange={(event) => {
                  const nextVolume = Number(event.target.value)
                  setVolume(nextVolume)
                  volumeRef.current = nextVolume
                  playerRef.current?.setVolume(nextVolume)
                }}
                className='min-w-0 flex-1 accent-primary'
              />
              <span className='w-7 text-right tabular-nums min-[60rem]:sr-only'>{volume}</span>
            </label>
            <span className='hidden text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase min-[60rem]:block'>
              {isRoomActive ? snapshot.playback.state : snapshot.status}
            </span>
          </div>

          {command.isError ? (
            <p role='alert' className='mt-3 flex items-center gap-2 text-sm text-destructive'>
              <AlertCircle aria-hidden='true' className='size-4' /> {errorMessage}
            </p>
          ) : null}
          {recoveryMessage ? (
            <p role='status' className='mt-3 flex items-center gap-2 text-sm text-muted-foreground'>
              <AlertCircle aria-hidden='true' className='size-4' /> {recoveryMessage}
            </p>
          ) : null}
          {command.isSuccess ? (
            <p role='status' className='sr-only'>
              Playback state updated.
            </p>
          ) : null}
        </section>

        {snapshot.recentActivity ? (
          <p
            key={snapshot.recentActivity.id}
            role='status'
            aria-live='polite'
            className='shrink-0 truncate text-xs text-muted-foreground'
          >
            {snapshot.recentActivity.status === 'removed'
              ? `${snapshot.recentActivity.videoTitle}, requested by ${snapshot.recentActivity.requesterDisplayName}, was removed.`
              : snapshot.recentActivity.status === 'skipped'
                ? `${snapshot.recentActivity.videoTitle}, requested by ${snapshot.recentActivity.requesterDisplayName}, was skipped.`
                : snapshot.recentActivity.status === 'failed'
                  ? `${snapshot.recentActivity.videoTitle} could not be played.`
                  : `${snapshot.recentActivity.videoTitle} finished.`}
          </p>
        ) : null}

        <div className='min-w-0 min-[60rem]:min-h-0 min-[60rem]:flex-1 min-[60rem]:overflow-hidden'>
          <RoomSyncPanel initialSnapshot={initialSnapshot} showGuests canModerate display='tv' />
        </div>
        {guestUrl && qrCodeDataUrl ? (
          <div className='shrink-0'>
            <RoomJoiningDisplay
              guestUrl={guestUrl}
              qrCodeDataUrl={qrCodeDataUrl}
              roomCode={roomCode}
            />
          </div>
        ) : null}
        <div className='flex shrink-0 items-center justify-between gap-4 border-t border-border pt-4'>
          <Link
            href='/privacy'
            className='text-xs text-muted-foreground underline underline-offset-4'
          >
            Privacy notice
          </Link>
          <EndRoomControl action={endAction} />
        </div>
      </aside>
    </div>
  )
}
