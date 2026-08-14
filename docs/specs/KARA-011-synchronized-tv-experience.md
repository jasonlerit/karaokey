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
- Make the right sidebar a full-height column with exactly three primary sections: persistent
  playback and room-exit controls, an independently scrolling queue, and compact invitation access.
- Clearly identify the current song and singer and show ordered upcoming songs and singers.
- Show at least the next three requests when space permits.
- Keep host playback controls reachable without scrolling the queue.
- Provide accessible joining-information access through an invitation dialog.
- Present recent terminal queue activity compactly outside the scrolling upcoming-song list.
- Provide coherent idle, loading, disconnected, playback-error, ended, and expired states.
- Optimize legibility and control sizing for 16:9 screens at 1280×720 and above.

## Acceptance criteria

1. During playback, the player occupies the left region and the queue the right region at supported 16:9 resolutions.
2. The current song and requester are visually and textually distinct from upcoming items without relying on color alone.
3. Upcoming items display clear order, title, and requester, with at least three visible when available and space permits.
4. The Now Playing treatment remains compact enough that it does not dominate the available queue
   height.
5. The queue consumes the sidebar's remaining height and scrolls internally when its contents
   overflow; playback controls and Invite Singers remain reachable without scrolling the queue.
6. The room code remains visible, and Invite Singers opens a dismissible QR dialog without
   permanently obscuring playback.
7. Recent removed, skipped, completed, or failed activity appears as a compact visible status near
   the playback controls and remains announced to assistive technology rather than appearing under
   Up Next.
8. Queue and playback changes arrive without manual refresh and stale events do not roll back the view.
9. Core controls remain usable with keyboard, mouse, touchpad, or a TV-connected touch display.
10. Idle, offline, error, ended, and expired states are legible and actionable from across a room.
11. The compact playback section contains icon-first Play/Pause, Restart, Skip, and End Room
    controls; every control has an accessible name, and End Room requires confirmation.

## Out of scope

- Support below 1280×720 as a guaranteed host-display target.
- Smart-TV native applications.

## PRD traceability

FR-41–FR-45; TV UX requirements; 16:9 compatibility target; MVP acceptance criterion 4.
