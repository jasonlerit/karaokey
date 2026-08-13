# KARA-008 — Server-authoritative playback lifecycle

## Summary

Define the authoritative queue-item playback state machine and atomically promote the earliest valid queued item when playback begins, completes, skips, or fails.

## Dependencies

- KARA-003 — Realtime room synchronization
- KARA-006 — Atomic shared queue and request rules

## Scope

- Represent idle, current-item identity, playback state, and last-known playback position on the room.
- Transition queue items among queued, playing, completed, skipped, and failed states with applicable timestamps.
- Promote the earliest valid queued item in the same authoritative operation that finishes the prior item.
- Prevent concurrent completion, skip, and failure signals from advancing more than once.
- Ignore terminal items when selecting the next item.
- Return the room to idle when no valid queued items remain without ending it.
- Broadcast resulting room, current-item, and queue changes.

## Acceptance criteria

1. Starting an idle room atomically promotes the earliest valid queued item to playing.
2. Completing, skipping, or failing the current item records one terminal state and selects the next valid item exactly once.
3. Concurrent or retried advancement requests cannot skip an extra valid item.
4. Removed or terminal items are never promoted.
5. When no valid item remains, the room becomes idle and remains active.
6. Every successful transition produces a newer authoritative room version for live synchronization.
7. Invalid transitions return a stable conflict result without corrupting queue state.

## Out of scope

- YouTube player embedding and transport controls.
- Permission rules for host commands.
- Automated retry criteria for unplayable videos.

## Open decisions

- Define whether playback position is persisted periodically, on player events, or only on state transitions.
- Define the exact conflict behavior when delayed player events arrive after a newer host command.

## PRD traceability

FR-27, FR-28, FR-32, FR-35, FR-37; journey 7.4; Section 9 playback rules; atomic-advancement reliability requirement; MVP acceptance criteria 7 and 11.
