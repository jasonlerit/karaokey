# KARA-009 — TV player and host playback controls

## Summary

Embed the supported YouTube player on the host display and provide authorized play, pause, restart,
skip, and room-exit controls while reconciling detectable player events with authoritative room
state.

## Dependencies

- KARA-001 — Anonymous room lifecycle and host authority
- KARA-003 — Realtime room synchronization
- KARA-008 — Server-authoritative playback lifecycle

## Scope

- Load the current video using the official supported YouTube embedded-player integration.
- Provide play/pause, restart, skip, and confirmed room-exit controls on the host screen.
- Initialize embedded-player volume at 100% and rely on the TV or supported YouTube player controls
  for subsequent volume changes.
- Enforce host authorization for server-state-changing commands.
- Show a prominent Start playback action when autoplay is blocked.
- Attempt to start the earliest queued item automatically when the host observes an idle active
  room, with a client guard that suppresses duplicate attempts for the same idle queue state.
- Translate detectable player play, pause, ended, error, and position events into safe reconciliation requests.
- Keep guest clients informed of relevant playback state without playing video on their devices.
- Respect YouTube branding, player, advertising, and content restrictions.

## Acceptance criteria

1. The current item loads in an official embedded YouTube player on the host screen.
2. A valid host can play/pause, restart, skip, and initiate a confirmed room exit from the compact
   playback-control row.
3. Guest or invalid credentials cannot invoke host-only state changes through direct server requests.
4. If autoplay is blocked, the host sees and can activate a prominent Start playback control.
5. A player-ended event advances the authoritative queue exactly once.
6. Detectable out-of-band player changes reconcile without overwriting newer server state.
7. Restart returns the current video to its beginning without changing queue order or creating a new queue item.
8. The player initializes at 100% volume without rendering a separate application volume control;
   TV and supported YouTube player volume controls remain available.
9. The first queued item in an idle active room triggers one automatic start attempt; a blocked
   autoplay attempt leaves a prominent, operable Start playback fallback.

## Out of scope

- Guest-device video playback.
- Downloading, transcoding, ad removal, or custom media streaming.
- Guaranteed playback of region-, age-, or account-restricted content.

## Open decisions

- Decide whether autoplay is only a browser-driven state or a host-configurable room preference.
- Define which out-of-band player actions must be reconciled and their conflict rules.

## PRD traceability

FR-29–FR-34; journey 7.4; YouTube player constraints; MVP acceptance criteria 4, 6, and 7.
