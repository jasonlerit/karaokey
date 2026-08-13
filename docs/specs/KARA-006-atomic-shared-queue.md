# KARA-006 — Atomic shared queue and request rules

## Summary

Provide a server-authoritative FIFO queue that accepts concurrent, idempotent song requests without loss, duplication, or incorrect ordering while enforcing room and guest limits.

## Dependencies

- KARA-001 — Anonymous room lifecycle and host authority
- KARA-002 — Guest admission and room-scoped identity
- KARA-005 — YouTube song discovery and selection

## Scope

- Persist the required queue-item identity, video metadata snapshot, requester snapshot, ordering, status, and timestamps.
- Append accepted requests atomically to an active room.
- Assign stable item IDs and unambiguous server ordering under concurrent submissions.
- Require an idempotency key for add requests and return the original result for safe retries.
- Enforce per-guest and per-room upcoming-item limits.
- Reject the same video when already current or queued for the same guest while permitting another guest to request it.
- Ensure terminal items do not reappear in the active queue.
- Publish accepted queue changes through the realtime system.

## Acceptance criteria

1. A valid guest can append an eligible video to an active room and receives its stable queue item and position.
2. Concurrent accepted additions have unique IDs and deterministic FIFO ordering with no lost items.
3. Retrying the same logical add request does not create another item.
4. A guest at the configured upcoming-song limit receives an actionable rejection.
5. A room at the configured queue limit receives an actionable rejection.
6. The same guest cannot queue a video already current or upcoming for that guest; another guest can request it.
7. Ended or expired rooms and invalid room sessions cannot accept additions.
8. Removed, skipped, failed, and completed items never return to the active queue automatically.

## Out of scope

- Queue reordering.
- Playback advancement.
- Guest and host removal permissions.

## Open decisions

- Confirm limits of three upcoming songs per guest and fifty per room.
- Ratify the recommended duplicate rule as the fixed MVP policy rather than a configurable room policy.
- Define whether ordering is represented by a sequence, sortable key, or another database-safe mechanism.

## PRD traceability

FR-20–FR-24, FR-27, FR-37, FR-40; Queue item data model; Section 9 queue rules; concurrency and atomicity requirements; MVP acceptance criteria 3 and 5.
