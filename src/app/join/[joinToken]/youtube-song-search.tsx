'use client'

import Image from 'next/image'
import { FormEvent, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertCircle, ChevronLeft, ChevronRight, LoaderCircle, Search, Video } from 'lucide-react'
import { z } from 'zod'

import { formatVideoDuration } from '@/common/youtube-duration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const videoSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  channel: z.string(),
  thumbnailUrl: z.url(),
  durationSeconds: z.number().optional(),
  embeddable: z.literal(true),
})

const searchResultSchema = z.object({
  items: z.array(videoSchema),
  nextPageToken: z.string().optional(),
  prevPageToken: z.string().optional(),
})

type SearchRequest = { query: string; pageToken?: string }

class SearchError extends Error {
  constructor(
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code)
  }
}

const readError = async (response: Response) => {
  const body = z
    .object({ code: z.string(), message: z.string().optional() })
    .safeParse(await response.json().catch(() => undefined))
  throw new SearchError(
    body.success ? body.data.code : 'unavailable',
    body.success ? body.data.message : undefined,
  )
}

const searchVideos = async (roomId: string, request: SearchRequest) => {
  const parameters = new URLSearchParams({ q: request.query })
  if (request.pageToken) parameters.set('pageToken', request.pageToken)

  const response = await fetch(`/api/rooms/${roomId}/youtube/search?${parameters}`)
  if (!response.ok) return readError(response)
  return searchResultSchema.parse(await response.json())
}

const addVideoToQueue = async (
  roomId: string,
  request: { videoId: string; idempotencyKey: string },
) => {
  const response = await fetch(`/api/rooms/${roomId}/queue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) return readError(response)
  return z
    .object({
      item: z.object({
        id: z.uuid(),
        position: z.number(),
        video: videoSchema.omit({ embeddable: true }),
      }),
      replayed: z.boolean(),
    })
    .parse(await response.json())
}

const errorContent = (error: Error) => {
  const code = error instanceof SearchError ? error.code : 'unavailable'
  const content: Record<string, { title: string; description: string }> = {
    invalid_query: {
      title: 'Try a more specific search',
      description: error.message,
    },
    quota_exceeded: {
      title: 'YouTube search limit reached',
      description: 'Ask the host to try again later when the search allowance resets.',
    },
    not_configured: {
      title: 'Song search is not configured',
      description: 'Ask the host to configure YouTube search for this Karaokey server.',
    },
    unauthorized: {
      title: 'Guest session unavailable',
      description: 'Reopen the room link and join again before searching.',
    },
    video_unavailable: {
      title: 'Video no longer available',
      description: 'Choose another result or search again.',
    },
    duplicate_video: {
      title: 'Song already requested',
      description: 'You already have this video in the active queue.',
    },
    guest_limit_reached: {
      title: 'Your queue is full',
      description: 'You can have up to three upcoming songs. Try again after one plays.',
    },
    room_limit_reached: {
      title: 'The room queue is full',
      description: 'The room already has fifty upcoming songs. Try again when the queue moves.',
    },
    room_ended: {
      title: 'Room ended',
      description: 'This room is no longer accepting song requests.',
    },
    room_expired: {
      title: 'Room expired',
      description: 'This room is no longer accepting song requests.',
    },
    invalid_request: {
      title: 'Request could not be added',
      description: 'Choose the song again and retry.',
    },
    unavailable: {
      title: 'YouTube search unavailable',
      description: 'Check your connection and try the search again.',
    },
  }
  return content[code] ?? content.unavailable
}

export const YouTubeSongSearch = ({ roomId }: { roomId: string }) => {
  const [query, setQuery] = useState('')
  const [request, setRequest] = useState<SearchRequest>()
  const [inputError, setInputError] = useState<string>()
  const search = useQuery({
    queryKey: ['youtube-search', roomId, request?.query, request?.pageToken],
    queryFn: () => searchVideos(roomId, request!),
    enabled: request !== undefined,
    retry: (failureCount, error) =>
      failureCount < 1 && error instanceof SearchError && error.code === 'unavailable',
    staleTime: 0,
  })
  const selection = useMutation({
    mutationFn: (request: { videoId: string; idempotencyKey: string }) =>
      addVideoToQueue(roomId, request),
    retry: (failureCount, error) =>
      failureCount < 1 && (!(error instanceof SearchError) || error.code === 'unavailable'),
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = query.trim()
    if (normalized.length < 2 || normalized.length > 100) {
      setInputError('Enter between 2 and 100 characters.')
      return
    }
    setInputError(undefined)
    selection.reset()
    setRequest({ query: normalized })
    if (request?.query === normalized && request.pageToken === undefined) void search.refetch()
  }

  const error = search.error ? errorContent(search.error) : undefined
  const selectionError = selection.error ? errorContent(selection.error) : undefined

  return (
    <section
      className='mt-6 border-t border-border pt-6 text-left'
      aria-labelledby='song-search-title'
    >
      <div className='text-center'>
        <Video aria-hidden='true' className='mx-auto size-8 text-destructive' />
        <h2 id='song-search-title' className='mt-3 text-xl font-semibold'>
          Find a karaoke song
        </h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          Search by song title, artist, or keywords. Results come from YouTube.
        </p>
      </div>

      <form onSubmit={submit} className='mt-5 flex flex-col gap-2 min-[420px]:flex-row'>
        <Input
          type='search'
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='Song title or artist'
          aria-label='Search YouTube karaoke videos'
          aria-invalid={Boolean(inputError)}
          className='h-11 text-base'
        />
        <Button type='submit' size='lg' className='h-11' disabled={search.isFetching}>
          {search.isFetching ? (
            <LoaderCircle aria-hidden='true' className='animate-spin' />
          ) : (
            <Search aria-hidden='true' />
          )}
          Search
        </Button>
      </form>
      {inputError ? <p className='mt-2 text-sm text-destructive'>{inputError}</p> : null}

      {!request && !inputError ? (
        <p className='mt-6 text-center text-sm text-muted-foreground'>
          Search for a favorite song to see playable karaoke videos.
        </p>
      ) : null}

      {error ? (
        <div role='alert' className='mt-6 rounded-xl border border-destructive/30 p-4'>
          <p className='flex items-center gap-2 font-medium text-destructive'>
            <AlertCircle aria-hidden='true' className='size-4' />
            {error.title}
          </p>
          <p className='mt-1 text-sm text-muted-foreground'>{error.description}</p>
        </div>
      ) : null}

      {search.data?.items.length === 0 ? (
        <div className='mt-6 rounded-xl border border-border p-5 text-center'>
          <p className='font-medium'>No playable videos found</p>
          <p className='mt-1 text-sm text-muted-foreground'>
            Try another title, artist, or spelling.
          </p>
        </div>
      ) : null}

      {search.data?.items.length ? (
        <ul className='mt-6 space-y-3'>
          {search.data.items.map((video) => {
            const duration = formatVideoDuration(video.durationSeconds)
            return (
              <li
                key={video.videoId}
                className='flex flex-col gap-3 rounded-xl border border-border p-3 min-[420px]:flex-row'
              >
                <div className='relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-muted min-[420px]:w-32'>
                  <Image
                    src={video.thumbnailUrl}
                    alt=''
                    fill
                    sizes='(max-width: 419px) 100vw, 128px'
                    className='object-cover'
                  />
                  {duration ? (
                    <span className='absolute right-1 bottom-1 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white'>
                      {duration}
                    </span>
                  ) : null}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='line-clamp-2 text-sm font-medium'>{video.title}</p>
                  <p className='mt-1 truncate text-xs text-muted-foreground'>{video.channel}</p>
                  <Button
                    type='button'
                    size='sm'
                    variant='secondary'
                    className='mt-3 h-11 w-full min-[420px]:w-auto'
                    disabled={selection.isPending}
                    onClick={() =>
                      selection.mutate({
                        videoId: video.videoId,
                        idempotencyKey: crypto.randomUUID(),
                      })
                    }
                  >
                    {selection.isPending && selection.variables?.videoId === video.videoId
                      ? 'Adding…'
                      : 'Add to queue'}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}

      {selection.isSuccess ? (
        <p role='status' className='mt-4 text-sm font-medium text-primary'>
          {selection.data.item.video.title} added at position {selection.data.item.position}.
        </p>
      ) : null}
      {selectionError ? (
        <p role='alert' className='mt-4 text-sm text-destructive'>
          {selectionError.title}. {selectionError.description}
        </p>
      ) : null}

      {search.data?.prevPageToken || search.data?.nextPageToken ? (
        <div className='mt-6 flex justify-between gap-3'>
          <Button
            type='button'
            variant='outline'
            disabled={!search.data.prevPageToken || search.isFetching}
            onClick={() =>
              setRequest({ query: request!.query, pageToken: search.data?.prevPageToken })
            }
          >
            <ChevronLeft aria-hidden='true' /> Previous
          </Button>
          <Button
            type='button'
            variant='outline'
            disabled={!search.data.nextPageToken || search.isFetching}
            onClick={() =>
              setRequest({ query: request!.query, pageToken: search.data?.nextPageToken })
            }
          >
            Next <ChevronRight aria-hidden='true' />
          </Button>
        </div>
      ) : null}
    </section>
  )
}
