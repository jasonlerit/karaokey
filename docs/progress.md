# Progress

Last updated: 2026-08-13

## Current phase

Phase 1 — Room foundation

## Current

None

## Last completed

KARA-002 — Guest admission and room-scoped identity

## Next

KARA-003 — Real-time room synchronization foundation

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
