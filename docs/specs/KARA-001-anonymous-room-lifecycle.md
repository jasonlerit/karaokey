# KARA-001 — Anonymous room lifecycle and host authority

## Summary

Allow a person to create and manage a temporary karaoke room without an account. A room has a short human-readable code, a high-entropy guest join token, and a separate secret host credential whose raw value is never stored server-side or exposed to guest clients.

## Dependencies

None.

## Scope

- Create an active room and return its room code, guest URL, expiration information, and one-time raw host credential.
- Persist the room identity, status, hashed host credential, playback fields, and lifecycle timestamps.
- Restore host authority on the same browser while the credential remains valid.
- Authorize host-only room operations by verifying the credential server-side.
- End a room explicitly and reject subsequent joins or mutations.
- Expire inactive rooms and enforce an absolute maximum lifetime.
- Present distinct active, ended, expired, invalid-room, and invalid-host-credential outcomes.

## Acceptance criteria

1. An unauthenticated user can create a room and receives a non-sequential join URL, short room code, and host credential.
2. The guest URL and guest-facing responses never contain the host credential.
3. Only a cryptographic hash of the host credential is stored server-side.
4. Refreshing or reopening the room in the same host browser restores host controls while the room and credential are valid.
5. A valid host can end the room; an invalid or guest credential cannot.
6. Ended and expired rooms reject new joins and state mutations with a clear machine-readable result.
7. Inactive rooms expire after the configured interval and no room remains active beyond the configured absolute lifetime.
8. Concurrent end or expiration operations leave the room in one consistent terminal state.

## Out of scope

- Guest identity and admission UI.
- QR-code rendering.
- Queue and playback behavior.
- Cross-room host accounts or room recovery on a different browser.

## Open decisions

- Confirm the proposed six-hour inactivity timeout and twelve-hour absolute lifetime.
- Define exactly which accepted actions update `lastActiveAt`; passive player or connection heartbeats should not keep an abandoned room alive indefinitely.

## PRD traceability

FR-1, FR-2, FR-4–FR-8; journeys 7.1 and 7.5; Room data model; MVP acceptance criteria 1 and 10.
