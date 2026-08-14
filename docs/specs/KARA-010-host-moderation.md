# KARA-010 — Host queue moderation and room control

## Summary

Give a valid host the minimum moderation controls needed to keep an event moving: remove any upcoming item, skip the current item, and end a compromised room.

## Dependencies

- KARA-001 — Anonymous room lifecycle and host authority
- KARA-006 — Atomic shared queue and request rules
- KARA-008 — Server-authoritative playback lifecycle
- KARA-009 — TV player and host playback controls

## Scope

- Remove any queued item before it begins playing.
- Skip the current item and safely advance through the playback lifecycle.
- End the room through an explicit confirmation flow.
- Enforce every moderation permission server-side using the host credential.
- Broadcast moderation results and provide clear feedback to connected clients. The host TV may
  announce terminal activity to assistive technology without reserving persistent visible space.
- Make repeated or conflicting moderation requests safe.

## Acceptance criteria

1. A valid host can remove any upcoming queue item.
2. Removing an upcoming item marks it removed and it cannot later become current.
3. A valid host can skip the current item and advance to the next valid item exactly once.
4. A valid host can confirm ending the room, which stops playback and closes the room to subsequent joins and mutations.
5. Guests and invalid credentials cannot remove other guests' items, skip playback, or end the room through direct requests.
6. Repeated or concurrent moderation requests cannot corrupt the queue or advance twice.
7. Connected clients receive the resulting authoritative state and an appropriate status message;
   host-TV terminal activity may be visually omitted when an equivalent assistive announcement is
   preserved.

## Out of scope

- Queue reordering, cross-room bans, and durable moderation history.

## PRD traceability

FR-6, FR-26, FR-27, FR-31; journeys 7.4 and 7.5; host abuse controls; MVP acceptance criteria 6, 8, and 10.
