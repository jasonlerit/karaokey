# Progress

Last updated: 2026-08-13

## Current phase

Phase 1 — Room foundation

## Current

None

## Last completed

KARA-004 — Host lobby and room joining display

## Next

KARA-005 — YouTube song discovery

## Blockers

None

## Notes

- Specs are implemented in numerical order unless dependencies or blockers require otherwise.
- Update this document in the same commit as implementation progress.
- KARA-001 uses a six-hour inactivity lifetime capped at twelve hours from room creation.
- Migration `0001_serious_sumo.sql` has been applied to the configured database.
- KARA-002 display names use NFC normalization, collapsed whitespace, and a 1–24 visible
  grapheme limit. Emoji are allowed; control and hidden formatting characters are rejected.
- KARA-002 keeps room codes display-only; guests join through the hard-to-guess join URL.
- Migration `0002_gorgeous_vindicator.sql` adds guest sessions and has been applied to the
  configured database.
- KARA-003 uses authenticated Server-Sent Events with database-backed monotonic room versions.
  Clients reject stale or duplicate snapshots and reconnect with exponential backoff capped at
  fifteen seconds.
- Presence currently means admitted room-scoped guest sessions. Hosts receive guest names and
  counts; guests receive counts only.
- Migration `0003_slow_spitfire.sql` adds room snapshot versions and has been applied to the
  configured database.
- KARA-004 generates a 384-pixel, high-error-correction QR code on the server containing only the
  guest URL. The host lobby keeps its room code and joining instructions prominent at TV scale.
- Joining information uses a keyboard-accessible collapsible panel that is visible while idle and
  can be hidden later without permanently covering playback.
