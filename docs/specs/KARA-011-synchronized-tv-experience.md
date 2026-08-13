# KARA-011 — Synchronized TV room experience

## Summary

Deliver a legible, landscape-first host display with the current YouTube video on the left and the synchronized current and upcoming queue on the right.

## Dependencies

- KARA-003 — Realtime room synchronization
- KARA-004 — Host lobby and room joining display
- KARA-006 — Atomic shared queue and request rules
- KARA-008 — Server-authoritative playback lifecycle
- KARA-009 — TV player and host playback controls

## Scope

- Use an approximately 70/30 player-and-queue layout during playback.
- Clearly identify the current song and singer and show ordered upcoming songs and singers.
- Show at least the next three requests when space permits.
- Integrate host controls and accessible joining-information access.
- Provide coherent idle, loading, disconnected, playback-error, ended, and expired states.
- Optimize legibility and control sizing for 16:9 screens at 1280×720 and above.

## Acceptance criteria

1. During playback, the player occupies the left region and the queue the right region at supported 16:9 resolutions.
2. The current song and requester are visually and textually distinct from upcoming items without relying on color alone.
3. Upcoming items display clear order, title, and requester, with at least three visible when available and space permits.
4. QR and room-code access does not permanently obscure playback.
5. Queue and playback changes arrive without manual refresh and stale events do not roll back the view.
6. Core controls remain usable with keyboard, mouse, touchpad, or a TV-connected touch display.
7. Idle, offline, error, ended, and expired states are legible and actionable from across a room.

## Out of scope

- Support below 1280×720 as a guaranteed host-display target.
- Smart-TV native applications.

## PRD traceability

FR-41–FR-45; TV UX requirements; 16:9 compatibility target; MVP acceptance criterion 4.
