# KARA-004 — Host lobby and room joining display

## Summary

Provide the host-facing empty-room experience with a prominent room code and an accessible
invitation dialog containing clear joining instructions and a working QR code without permanently
covering playback.

## Dependencies

- KARA-001 — Anonymous room lifecycle and host authority
- KARA-003 — Realtime room synchronization

## Scope

- Transition directly from room creation to the host room screen.
- Generate and render a scannable QR code containing only the guest URL.
- Prominently show the room code and Invite Singers action while idle.
- Open the QR code and concise joining instructions in an accessible dialog.
- Keep the invitation dialog available from the active room layout.
- Reflect ended, expired, invalid-credential, and offline states clearly.
- Keep host credentials out of rendered URLs, QR data, telemetry, and guest-visible markup.

## Acceptance criteria

1. Creating a room opens a host screen showing its room code and a clearly labeled Invite Singers
   action.
2. Activating Invite Singers opens a keyboard-accessible dialog with the QR code and concise
   joining instructions; focus enters the dialog and returns to the trigger when it closes.
3. Scanning the QR code opens the correct guest URL and exposes no host credential.
4. The dialog presents a QR code usable at the target TV resolutions and normal viewing distance.
5. Joining information can be shown and dismissed during playback without permanently obscuring
   the player.
6. Empty, ended, expired, unauthorized, and temporarily disconnected states are visually distinct and actionable.
7. Lobby controls are keyboard accessible and have visible focus treatment.

## Out of scope

- Guest name entry.
- Queue rendering and YouTube playback.
- Printable invitations or public room discovery.

## PRD traceability

FR-3, FR-43, FR-45; journey 7.1; idle TV UX; MVP acceptance criterion 1.
