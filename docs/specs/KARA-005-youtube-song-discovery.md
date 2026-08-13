# KARA-005 — YouTube song discovery and selection

## Summary

Let an admitted guest search the official YouTube Data API for karaoke videos and select a result whose metadata and playback eligibility have been validated as far as the API permits.

## Dependencies

- KARA-002 — Guest admission and room-scoped identity

## Scope

- Search by title, artist, or general keywords through a server-side YouTube integration.
- Debounce or explicitly submit queries to limit quota consumption.
- Prefer embeddable results suitable for playback.
- Return video ID, title, channel, thumbnail, duration when available, and relevant eligibility data.
- Validate current availability and embeddability before a selection proceeds to queue submission when supported by the API.
- Provide empty, initial, loading, quota-exceeded, unavailable-video, invalid-query, and general-error results.
- Avoid downloading, modifying, or separately extracting video or audio.

## Acceptance criteria

1. A valid guest can search using a song title, artist, or keywords.
2. Every displayed result includes title, channel, thumbnail, and duration when the API provides it.
3. Only official YouTube APIs are used for discovery and metadata.
4. Search requests are debounced or require explicit submission and duplicate in-flight queries are controlled.
5. A selected video is checked for availability and embeddability immediately before queue submission when the API supports that check.
6. Empty, quota, unavailable, and general failure states give the guest an actionable next step.
7. API credentials and server-only response data are never exposed to the browser.

## Out of scope

- Queue insertion.
- Playback and guarantees that a video remains playable after validation.
- Non-YouTube catalogs, downloads, audio extraction, or ad removal.

## Open decisions

- Define “prioritize karaoke”: query rewriting, filters, application ranking, or API ordering.
- Define permitted metadata caching and cache duration under current YouTube policies.
- Define behavior when eligibility cannot be revalidated because quota is exhausted.

## PRD traceability

FR-14–FR-19; journey 7.3 steps 1–4; YouTube platform constraints; MVP acceptance criteria 3 and 11.
