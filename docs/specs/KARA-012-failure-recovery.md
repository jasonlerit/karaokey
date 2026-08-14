# KARA-012 — Playback and integration failure recovery

## Summary

Ensure temporary connectivity problems and YouTube search, metadata, or playback failures produce understandable, recoverable states and never permanently stall the active queue.

## Dependencies

- KARA-003 — Realtime room synchronization
- KARA-005 — YouTube song discovery and selection
- KARA-008 — Server-authoritative playback lifecycle
- KARA-009 — TV player and host playback controls

## Scope

- Categorize actionable YouTube search, metadata, quota, embedding, and player failures.
- Detect that a current video cannot be played within the supported player signals and timeout policy.
- Mark an unrecoverable current item failed and atomically advance to the next valid item.
- Make duplicate player-error signals and retry attempts idempotent.
- Notify host and guests of failed items without exposing sensitive provider details.
- Restore current state after realtime disconnection without duplicate actions.
- Return to a usable idle or retry state when external services remain unavailable.
- Treat browser-blocked autoplay as an expected interaction state rather than a playback failure;
  stop automatic retries until the host activates Start playback.

## Acceptance criteria

1. Search and metadata failures distinguish quota, unavailable-video, empty, and general errors when known.
2. An unrecoverable current video becomes failed and the next valid queued item is selected exactly once.
3. Failure of one video cannot leave later valid queue items permanently blocked.
4. Repeated player-error events do not advance multiple items.
5. Host and guest clients receive a clear failure notification and updated queue state.
6. A temporary realtime disconnect is visible, retries automatically, and restores a fresh snapshot before live processing resumes.
7. Persistent YouTube unavailability leaves the application in a stable state with a meaningful retry or host action.
8. Browser-blocked autoplay exposes one stable Start playback action and does not fail, discard, or
   repeatedly advance the current queue item.

## Out of scope

- Guaranteeing YouTube availability or uninterrupted, region-independent, age-independent, or ad-free playback.

## Open decisions

- Define load and playback timeouts, retry count, retryable error categories, and the point at which an item becomes failed.
- Define how region- or account-dependent restrictions are presented when the API could not predict them.

## PRD traceability

FR-18, FR-28, FR-33, FR-34, FR-38, FR-39; YouTube degradation requirements; reliability requirements; MVP acceptance criteria 9 and 11.
