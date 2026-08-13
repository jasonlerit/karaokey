import 'server-only'

import { createHash } from 'node:crypto'

import { env } from '@/common/env'
import { getFixedWindowRateLimit, type RateLimitPolicyName } from '@/common/rate-limit-policy'

type RateLimitEntry = { count: number; resetAt: number }

const globalForRateLimits = globalThis as typeof globalThis & {
  karaokeyRateLimits?: Map<string, RateLimitEntry>
}
const entries = (globalForRateLimits.karaokeyRateLimits ??= new Map())

const digest = (value: string) => createHash('sha256').update(value).digest('base64url')

const getClientIdentifier = (headers: Headers) => {
  if (env.RATE_LIMIT_TRUST_PROXY) {
    const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const realIp = headers.get('x-real-ip')?.trim()
    if (forwarded || realIp) return `ip:${forwarded ?? realIp}`
  }

  return `client:${headers.get('user-agent') ?? 'unknown'}`
}

export const checkRateLimit = ({
  policy,
  headers,
  scope = '',
  now = Date.now(),
}: {
  policy: RateLimitPolicyName
  headers: Headers
  scope?: string
  now?: number
}) => {
  const key = `${policy}:${digest(`${getClientIdentifier(headers)}:${scope}`)}`
  const current = entries.get(key) ?? { count: 0, resetAt: now }
  const result = getFixedWindowRateLimit({ ...current, now, policy })
  entries.set(key, { count: result.count, resetAt: result.resetAt })

  if (entries.size > 10_000) {
    for (const [entryKey, entry] of entries) {
      if (entry.resetAt <= now) entries.delete(entryKey)
    }
  }

  return { allowed: result.allowed, retryAfter: result.retryAfter }
}

export const rateLimitResponse = (retryAfter: number) =>
  Response.json(
    { code: 'rate_limited', message: 'Too many requests. Please wait and try again.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  )
