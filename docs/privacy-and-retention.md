# Privacy and retention operations

Karaokey stores only temporary room, guest-session, queue, and playback data needed for the active
room. Ended and expired rooms are retained for at most 24 hours, then deleted. PostgreSQL cascade
rules delete the room's guest sessions and queue items in the same operation.

Cleanup runs opportunistically during room expiration and access. Production deployments must also
invoke `POST /api/maintenance/retention` at least hourly with
`Authorization: Bearer <RETENTION_CLEANUP_SECRET>`. The secret must contain at least 32 random
characters and must not be placed in a URL, client bundle, analytics property, or log message.

`RATE_LIMIT_TRUST_PROXY` defaults to `false`. Enable it only when the deployment has a trusted edge
proxy that replaces `X-Forwarded-For` or `X-Real-IP`; never trust client-appended forwarding
headers. Limiter keys are SHA-256 digests held in process memory only and expire with their fixed
windows. Multi-instance production deployments should replace the in-memory store with a shared
short-lived store while retaining the policies in `src/common/rate-limit-policy.ts`.

Database query logging is disabled by default. Application and infrastructure logs must exclude
guest-entered display names, raw host credentials, full guest links and join tokens, cookie values,
request bodies, and YouTube API keys. Operational logs should retain only event categories,
timestamps, coarse outcomes, and non-secret correlation identifiers, with a target retention of no
more than seven days unless a shorter infrastructure policy applies.
