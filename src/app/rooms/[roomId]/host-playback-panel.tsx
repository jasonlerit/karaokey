'use client'

import Script from 'next/script'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  LoaderCircle,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Volume2,
} from 'lucide-react'
import { z } from 'zod'

import type { RoomSnapshot } from '@/common/room-sync-state'
import { getYouTubePlayerAction } from '@/common/youtube-player-state'
import { roomSnapshotKey } from '@/components/shared/room-sync-panel'
import { Button } from '@/components/ui/button'

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
  playerVars: { origin: string; playsinline: 1; rel: 0 }
  events: {
    onReady: () => void
    onStateChange: (event: { data: number }) => void
    onError: () => void
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

export const HostPlaybackPanel = ({ initialSnapshot }: { initialSnapshot: RoomSnapshot }) => {
  const playerElementId = `youtube-player-${initialSnapshot.roomId}`
  const playerRef = useRef<YouTubePlayer | null>(null)
  const loadedItemIdRef = useRef<string | null>(null)
  const advancedItemIdRef = useRef<string | null>(null)
  const lastReportedStateRef = useRef<string | null>(null)
  const mutationRef = useRef<(command: PlaybackCommand) => void>(() => undefined)
  const volumeRef = useRef(70)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [needsInteraction, setNeedsInteraction] = useState(false)
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

  const initializePlayer = useCallback(() => {
    const Player = window.YT?.Player
    if (playerRef.current || typeof Player !== 'function') return
    playerRef.current = new Player(playerElementId, {
      height: '100%',
      width: '100%',
      playerVars: { origin: window.location.origin, playsinline: 1, rel: 0 },
      events: {
        onReady: () => {
          playerRef.current?.setVolume(volumeRef.current)
          setIsPlayerReady(true)
        },
        onStateChange: ({ data }) => {
          const action = getYouTubePlayerAction(data)
          if (action === 'playing') {
            setNeedsInteraction(false)
            reportPlayerState('playing')
          } else if (action === 'paused') {
            setNeedsInteraction(false)
            reportPlayerState('paused')
          } else if (action === 'completed') {
            setNeedsInteraction(false)
            advanceLoadedItem('completed')
          }
        },
        onError: () => advanceLoadedItem('failed'),
        onAutoplayBlocked: () => setNeedsInteraction(true),
      },
    })
  }, [advanceLoadedItem, playerElementId, reportPlayerState])

  useEffect(() => {
    const previousReadyHandler = window.onYouTubeIframeAPIReady
    const readyHandler = () => {
      previousReadyHandler?.()
      initializePlayer()
    }
    window.onYouTubeIframeAPIReady = readyHandler
    const initializationTimer = window.setTimeout(initializePlayer, 0)

    return () => {
      window.clearTimeout(initializationTimer)
      if (window.onYouTubeIframeAPIReady === readyHandler) {
        window.onYouTubeIframeAPIReady = previousReadyHandler
      }
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [initializePlayer])

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
      return
    }

    if (loadedItemIdRef.current !== currentItem.id) {
      loadedItemIdRef.current = currentItem.id
      advancedItemIdRef.current = null
      lastReportedStateRef.current = null
      const videoRequest = {
        videoId: currentItem.video.videoId,
        startSeconds: snapshot.playback.positionSeconds,
      }
      if (snapshot.playback.state === 'paused') {
        player.cueVideoById(videoRequest)
      } else {
        player.loadVideoById(videoRequest)
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
    isPlayerReady,
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
    <section aria-labelledby='player-title'>
      <Script
        src='https://www.youtube.com/iframe_api'
        strategy='afterInteractive'
        onReady={initializePlayer}
      />
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h2 id='player-title' className='text-2xl font-semibold'>
            Karaoke player
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            {currentItem
              ? `${currentItem.video.title} — requested by ${currentItem.requester.displayName}`
              : 'Start when the first singer is ready.'}
          </p>
        </div>
        <p className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>
          {isRoomActive ? snapshot.playback.state : snapshot.status}
        </p>
      </div>

      <div className='relative mt-4 aspect-video min-h-50 overflow-hidden rounded-2xl bg-black'>
        <div id={playerElementId} className='size-full' />
        {!currentItem || !isPlayerReady ? (
          <div className='absolute inset-0 flex items-center justify-center bg-black text-center text-white'>
            <div className='p-6'>
              {currentItem && !isPlayerReady ? (
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

      {isRoomActive && ((hasQueuedItem && !currentItem) || (currentItem && needsInteraction)) ? (
        <Button
          type='button'
          size='lg'
          className='mt-4 h-12 w-full text-base'
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

      <div className='mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border p-3'>
        <Button
          type='button'
          variant='outline'
          className='h-11'
          disabled={!isRoomActive || !currentItem || !isPlayerReady || command.isPending}
          onClick={snapshot.playback.state === 'playing' ? pause : startOrPlay}
        >
          {snapshot.playback.state === 'playing' ? (
            <Pause aria-hidden='true' />
          ) : (
            <Play aria-hidden='true' />
          )}
          {snapshot.playback.state === 'playing' ? 'Pause' : 'Play'}
        </Button>
        <Button
          type='button'
          variant='outline'
          className='h-11'
          disabled={!isRoomActive || !currentItem || !isPlayerReady || command.isPending}
          onClick={restart}
        >
          <RotateCcw aria-hidden='true' /> Restart
        </Button>
        <Button
          type='button'
          variant='outline'
          className='h-11'
          disabled={!isRoomActive || !currentItem || command.isPending}
          onClick={skip}
        >
          <SkipForward aria-hidden='true' /> Skip
        </Button>
        <label className='ml-auto flex min-h-11 items-center gap-2 text-sm font-medium'>
          <Volume2 aria-hidden='true' className='size-4' />
          <span>Volume</span>
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
            className='w-28 accent-primary'
          />
          <span className='w-8 text-right tabular-nums'>{volume}</span>
        </label>
      </div>

      {command.isError ? (
        <p role='alert' className='mt-3 flex items-center gap-2 text-sm text-destructive'>
          <AlertCircle aria-hidden='true' className='size-4' /> {errorMessage}
        </p>
      ) : null}
      {command.isSuccess ? (
        <p role='status' className='sr-only'>
          Playback state updated.
        </p>
      ) : null}
    </section>
  )
}
