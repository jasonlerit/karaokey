import { z } from 'zod'

export const operationalEventSchema = z.discriminatedUnion('event', [
  z.object({ event: z.literal('room_created') }).strict(),
  z.object({ event: z.literal('guest_joined') }).strict(),
  z.object({ event: z.literal('rooms_expired'), count: z.int().nonnegative() }).strict(),
  z.object({ event: z.literal('retention_cleanup'), count: z.int().nonnegative() }).strict(),
  z
    .object({
      event: z.literal('youtube_api_request'),
      operation: z.enum(['search', 'videos']),
      outcome: z.enum(['ok', 'quota_exceeded', 'unavailable', 'not_configured']),
    })
    .strict(),
  z
    .object({
      event: z.literal('playback_failure'),
      category: z.enum(['video_failed', 'service_unavailable']),
    })
    .strict(),
  z.object({ event: z.literal('queue_failure'), operation: z.enum(['add', 'remove']) }).strict(),
  z.object({ event: z.literal('realtime_reconnected') }).strict(),
])

export type OperationalEvent = z.infer<typeof operationalEventSchema>

export const serializeOperationalEvent = (event: OperationalEvent, now = new Date()) => ({
  timestamp: now.toISOString(),
  ...operationalEventSchema.parse(event),
})
