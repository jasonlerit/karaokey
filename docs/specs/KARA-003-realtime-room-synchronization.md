# KARA-003 — Realtime room synchronization

## Summary

Keep host and guest clients synchronized from authoritative server state through an initial snapshot and ordered live events, including safe recovery after temporary connection loss.

## Dependencies

- KARA-001 — Anonymous room lifecycle and host authority
- KARA-002 — Guest admission and room-scoped identity

## Scope

- Return a versioned room snapshot containing the state appropriate to the requesting role.
- Broadcast room status, presence, queue, and playback changes to connected clients.
- Establish ordering or version semantics that let clients reject stale and duplicate events.
- Visibly report connection loss and reconnect automatically with bounded backoff.
- Fetch a fresh snapshot after reconnect before applying subsequent live events.
- Prevent host-only secrets or privileged data from entering guest snapshots or events.

## Acceptance criteria

1. A connected client sees an accepted room-state change without manually refreshing.
2. Events contain enough identity and ordering information to be applied at most once and in authoritative order.
3. A client that disconnects briefly shows a connection state and automatically attempts to reconnect with bounded backoff.
4. After reconnecting, the client obtains a new snapshot before consuming later events.
5. A stale event cannot roll back a newer snapshot or event.
6. Host and guest subscribers receive only data authorized for their role.
7. Reconnecting does not repeat a previously accepted mutation.

## Out of scope

- Defining queue and playback domain transitions.
- Synchronizing video playback on guest phones.
- A public list of rooms or remotely discoverable presence.

## Open decisions

- Select a realtime transport and hosting model.
- Define presence semantics, visibility, disconnect grace period, and whether presence is a user-facing MVP feature.
- Define the one-second propagation metric boundaries and measurement method.

## PRD traceability

FR-36–FR-39; realtime portions of journeys 7.2–7.5; reconnect reliability requirements; MVP acceptance criterion 9.
