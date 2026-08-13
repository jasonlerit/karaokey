import 'server-only'

import { z } from 'zod'

import { env } from '@/common/env'
import { recordOperationalEvent } from '@/common/operational-events'
import { parseYouTubeDuration } from '@/common/youtube-duration'

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3'
const SEARCH_RESULT_LIMIT = 10
const YOUTUBE_REQUEST_TIMEOUT_MS = 10_000

export const youtubeSearchQuerySchema = z
  .string()
  .trim()
  .min(2, 'Enter at least 2 characters.')
  .max(100, 'Keep your search under 100 characters.')

export const youtubeVideoIdSchema = z.string().regex(/^[A-Za-z0-9_-]{11}$/)
export const youtubePageTokenSchema = z.string().min(1).max(256).optional()

const thumbnailSchema = z.object({
  url: z.url(),
  width: z.number().optional(),
  height: z.number().optional(),
})
const snippetSchema = z.object({
  title: z.string(),
  channelTitle: z.string(),
  thumbnails: z.object({
    default: thumbnailSchema.optional(),
    medium: thumbnailSchema.optional(),
    high: thumbnailSchema.optional(),
  }),
})

const searchResponseSchema = z.object({
  items: z.array(z.object({ id: z.object({ videoId: youtubeVideoIdSchema }) })),
  nextPageToken: z.string().optional(),
  prevPageToken: z.string().optional(),
})

const videosResponseSchema = z.object({
  items: z.array(
    z.object({
      id: youtubeVideoIdSchema,
      snippet: snippetSchema,
      contentDetails: z.object({ duration: z.string().optional() }),
      status: z.object({ embeddable: z.boolean(), privacyStatus: z.string() }),
    }),
  ),
})

const youtubeErrorSchema = z.object({
  error: z.object({
    errors: z.array(z.object({ reason: z.string() })).optional(),
  }),
})

export type YouTubeVideo = {
  videoId: string
  title: string
  channel: string
  thumbnailUrl: string
  durationSeconds: number | undefined
  embeddable: true
}

export type YouTubeSearchResult = {
  items: YouTubeVideo[]
  nextPageToken?: string
  prevPageToken?: string
}

export class YouTubeApiError extends Error {
  constructor(public readonly code: 'quota_exceeded' | 'unavailable' | 'not_configured') {
    super(code)
  }
}

const requestYouTube = async (path: 'search' | 'videos', parameters: Record<string, string>) => {
  if (!env.YOUTUBE_API_KEY) {
    recordOperationalEvent({
      event: 'youtube_api_request',
      operation: path,
      outcome: 'not_configured',
    })
    throw new YouTubeApiError('not_configured')
  }

  const url = new URL(`${YOUTUBE_API_BASE_URL}/${path}`)
  Object.entries({ ...parameters, key: env.YOUTUBE_API_KEY }).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  )

  let response: Response
  try {
    response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(YOUTUBE_REQUEST_TIMEOUT_MS),
    })
  } catch {
    recordOperationalEvent({
      event: 'youtube_api_request',
      operation: path,
      outcome: 'unavailable',
    })
    throw new YouTubeApiError('unavailable')
  }

  const body: unknown = await response.json().catch(() => undefined)
  if (!response.ok) {
    const error = youtubeErrorSchema.safeParse(body)
    const reasons = error.success ? error.data.error.errors?.map(({ reason }) => reason) : []
    if (reasons?.some((reason) => reason === 'quotaExceeded' || reason === 'dailyLimitExceeded')) {
      recordOperationalEvent({
        event: 'youtube_api_request',
        operation: path,
        outcome: 'quota_exceeded',
      })
      throw new YouTubeApiError('quota_exceeded')
    }
    recordOperationalEvent({
      event: 'youtube_api_request',
      operation: path,
      outcome: 'unavailable',
    })
    throw new YouTubeApiError('unavailable')
  }

  recordOperationalEvent({ event: 'youtube_api_request', operation: path, outcome: 'ok' })
  return body
}

const toVideo = (item: z.infer<typeof videosResponseSchema>['items'][number]): YouTubeVideo => {
  const thumbnail =
    item.snippet.thumbnails.high ??
    item.snippet.thumbnails.medium ??
    item.snippet.thumbnails.default
  if (!thumbnail) throw new YouTubeApiError('unavailable')

  return {
    videoId: item.id,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnailUrl: thumbnail.url,
    durationSeconds: parseYouTubeDuration(item.contentDetails.duration),
    embeddable: true,
  }
}

const getVideos = async (videoIds: string[]) => {
  if (videoIds.length === 0) return []
  const body = await requestYouTube('videos', {
    id: videoIds.join(','),
    part: 'snippet,contentDetails,status',
  })
  const parsed = videosResponseSchema.safeParse(body)
  if (!parsed.success) throw new YouTubeApiError('unavailable')

  return parsed.data.items
    .filter((item) => item.status.embeddable && item.status.privacyStatus === 'public')
    .map(toVideo)
}

const prioritizeKaraoke = (query: string) =>
  /\bkaraoke\b/i.test(query) ? query : `${query} karaoke`

export const searchYouTube = async (
  rawQuery: unknown,
  rawPageToken?: unknown,
): Promise<YouTubeSearchResult> => {
  const query = youtubeSearchQuerySchema.parse(rawQuery)
  const pageToken = youtubePageTokenSchema.parse(rawPageToken)
  const body = await requestYouTube('search', {
    maxResults: String(SEARCH_RESULT_LIMIT),
    part: 'snippet',
    q: prioritizeKaraoke(query),
    safeSearch: 'moderate',
    type: 'video',
    videoEmbeddable: 'true',
    videoSyndicated: 'true',
    ...(pageToken ? { pageToken } : {}),
  })
  const parsed = searchResponseSchema.safeParse(body)
  if (!parsed.success) throw new YouTubeApiError('unavailable')

  return {
    items: await getVideos(parsed.data.items.map(({ id }) => id.videoId)),
    nextPageToken: parsed.data.nextPageToken,
    prevPageToken: parsed.data.prevPageToken,
  }
}

export const validateYouTubeVideo = async (
  rawVideoId: unknown,
): Promise<YouTubeVideo | undefined> => {
  const videoId = youtubeVideoIdSchema.parse(rawVideoId)
  const [video] = await getVideos([videoId])
  return video
}
