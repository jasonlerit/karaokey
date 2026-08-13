export const rateLimitPolicies = {
  roomCreation: { limit: 5, windowMs: 10 * 60_000 },
  roomJoin: { limit: 10, windowMs: 10 * 60_000 },
  youtubeSearch: { limit: 30, windowMs: 60_000 },
  queueMutation: { limit: 20, windowMs: 60_000 },
} as const

export type RateLimitPolicyName = keyof typeof rateLimitPolicies

export const getFixedWindowRateLimit = ({
  count,
  resetAt,
  now,
  policy,
}: {
  count: number
  resetAt: number
  now: number
  policy: RateLimitPolicyName
}) => {
  const configuration = rateLimitPolicies[policy]
  if (now >= resetAt) {
    return { allowed: true, count: 1, resetAt: now + configuration.windowMs, retryAfter: 0 }
  }

  const nextCount = count + 1
  return {
    allowed: nextCount <= configuration.limit,
    count: nextCount,
    resetAt,
    retryAfter: Math.max(1, Math.ceil((resetAt - now) / 1000)),
  }
}
