# KARA-004 — Host lobby and room joining display

## Summary

Provide the host-facing empty-room experience with clear joining instructions, a working QR code, room code, and a way to reveal joining information later without permanently covering playback.

## Dependencies

- KARA-001 — Anonymous room lifecycle and host authority
- KARA-003 — Realtime room synchronization

## Scope

- Transition directly from room creation to the host room screen.
- Generate and render a scannable QR code containing only the guest URL.
- Prominently show the room code and concise joining instructions while idle.
- Allow joining information to remain accessible from the active room layout.
- Reflect ended, expired, invalid-credential, and offline states clearly.
- Keep host credentials out of rendered URLs, QR data, telemetry, and guest-visible markup.

## Acceptance criteria

1. Creating a room opens a host screen showing its QR code, room code, and joining instructions.
2. Scanning the QR code opens the correct guest URL and exposes no host credential.
3. The QR code remains usable at the target TV resolutions and normal viewing distance.
4. Joining information can be shown during playback without permanently obscuring the player.
5. Empty, ended, expired, unauthorized, and temporarily disconnected states are visually distinct and actionable.
6. Lobby controls are keyboard accessible and have visible focus treatment.

## Out of scope

- Guest name entry.
- Queue rendering and YouTube playback.
- Printable invitations or public room discovery.

## Open decisions

- Decide whether the active-room join information lives in the queue panel, an overlay, or both.

## PRD traceability

FR-3, FR-43, FR-45; journey 7.1; idle TV UX; MVP acceptance criterion 1.
