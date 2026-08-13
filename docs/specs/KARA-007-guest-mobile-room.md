# KARA-007 — Guest mobile room and self-service queue

## Summary

Provide a touch-friendly guest room where search is primary, the shared queue is understandable, personal requests are identifiable, and a guest can safely remove only their own upcoming songs.

## Dependencies

- KARA-003 — Realtime room synchronization
- KARA-005 — YouTube song discovery and selection
- KARA-006 — Atomic shared queue and request rules

## Scope

- Optimize the joined-room experience for narrow mobile viewports and touch input.
- Present search and queue through a compact layout or segmented navigation.
- Show the current song, requester, shared upcoming order, and the guest's own upcoming requests.
- Confirm successful additions immediately and disable or deduplicate repeated submission gestures.
- Let a guest remove their own queued item before playback begins.
- Reject attempts to remove current, terminal, or another guest's item.
- Announce important mutation and room-status results to assistive technology.

## Acceptance criteria

1. Search is the primary action on supported phone viewports without blocking access to the queue.
2. The guest can identify what is playing, who requested each item, their own requests, and each upcoming position.
3. A successful add provides immediate visible and assistive confirmation and repeated taps do not duplicate it.
4. A guest can remove their own queued request before it begins.
5. A guest cannot remove another guest's request or any playing or terminal item, including through a direct request.
6. The interface remains usable with normal browser zoom, accessible text sizing, keyboard input, and touch targets.
7. Refresh and reconnect restore the current authoritative view without replaying mutations.

## Out of scope

- Host controls and queue reordering.
- Video playback on guest phones.

## Open decisions

- Choose the final Search/Queue navigation pattern after narrow-viewport validation.

## PRD traceability

FR-25, FR-46–FR-49; phone UX requirements; journey 7.3; MVP acceptance criteria 8 and 9.
