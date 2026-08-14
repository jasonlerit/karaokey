# KARA-013 — Privacy, retention, and abuse protection

## Summary

Protect anonymous rooms with data minimization, server-side validation and authorization, rate limiting, secret-safe handling, short retention, privacy-conscious logs, and a concise public privacy notice.

## Dependencies

- KARA-001 — Anonymous room lifecycle and host authority
- KARA-002 — Guest admission and room-scoped identity
- KARA-005 — YouTube song discovery and selection
- KARA-006 — Atomic shared queue and request rules
- KARA-010 — Host queue moderation and room control

## Scope

- Validate and normalize all untrusted inputs at server boundaries and render display names safely.
- Treat join tokens and host credentials as secrets and prevent them from entering guest data, analytics, or logs.
- Rate-limit room creation, joining, search, and queue mutations using appropriate short-lived identifiers.
- Delete or anonymize expired room, guest, and queue data within the documented retention window.
- Retain only operational data needed to provide and protect the service.
- Give hosts controls to remove abusive requests and end compromised rooms.
- Publish a concise notice covering anonymous sessions, temporary data, logs, retention, and YouTube processing.

## Acceptance criteria

1. No product flow requires an account, email address, phone number, or durable guest identity.
2. All user-controlled fields are validated server-side and display names render without executable markup or unsafe context injection.
3. Raw host credentials, full guest URLs, and guest-entered names are absent from analytics and ordinary operational logs.
4. Each required operation has an enforced rate limit with a safe response that does not reveal secrets.
5. Expired room-domain data is deleted or anonymized within the configured and documented period.
6. Authorization tests prove guests cannot invoke host controls or remove another guest's queued items.
7. A publicly accessible privacy notice accurately describes collected data, retention, operational logs, and YouTube processing.
8. Every application screen retains a discoverable privacy-notice link; the host room may place
   that link inside its Invite Singers dialog to preserve TV layout space.

## Out of scope

- Accounts, durable reputation, cross-room bans, or advanced moderation.
- A general-purpose consent-management platform unless legally required.

## Open decisions

- Confirm the proposed cleanup target of 24 hours after room expiration.
- Define rate thresholds, identifier hierarchy, trusted-proxy behavior, and log retention.
- Decide the privacy-notice route and where it is linked from host and guest screens.

## PRD traceability

Section 12 in full; data-minimization goals; room cleanup requirements; YouTube third-party-processing notice; security aspects of FR-4, FR-11, FR-17, and FR-31.
