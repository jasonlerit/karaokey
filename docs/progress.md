# Progress

Last updated: 2026-08-13

## Current phase

Phase 4 — Synchronized TV experience

## Current

None

## Last completed

KARA-010 — Host queue moderation and room control

## Next

KARA-011 — Synchronized TV room experience

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
- KARA-005 uses authenticated server routes for official YouTube `search.list` and `videos.list`
  requests. Search is explicitly submitted, uncached, paginated, and appends `karaoke` only when
  the query does not already contain it.
- Search results are filtered and revalidated for public embeddability. Initial, loading, empty,
  invalid-query, quota, unavailable-video, configuration, and general-error states are distinct.
- Set the server-only `YOUTUBE_API_KEY` environment variable to enable song discovery. No YouTube
  credential or unvalidated upstream response is sent to the browser.
- KARA-006 fixes the MVP limits at three upcoming songs per guest and fifty per room. Duplicate
  videos are rejected only when already current or upcoming for the same guest; another guest may
  request the same video.
- Queue additions lock the room row in a database transaction, use a monotonic per-room sequence,
  and persist the original queue position. Guest-scoped UUID idempotency keys return the original
  accepted result on retry.
- Active queue items are included in realtime snapshots in server FIFO order. Terminal items are
  retained as history but excluded from active snapshots and limit calculations.
- Migration `0004_flimsy_proteus.sql` adds queue items and has been applied to the configured
  database.
- KARA-007 uses a compact single-page mobile layout with search first and the authoritative live
  queue immediately below it. Current and upcoming requesters are visible, while a guest's own
  requests are explicitly marked.
- Guests can remove only their own queued items through an authenticated endpoint. The server
  locks the room and item, rejects non-owners and non-queued states, records removal as a terminal
  state, and advances the realtime room version.
- Add and remove controls use touch-sized targets, suppress concurrent gestures, update the
  visible queue immediately after success, and announce mutation and room-status results to
  assistive technology.
- KARA-008 serializes every playback transition on the room row. Starting promotes only the
  earliest queued item; completing, skipping, or failing the current item records its terminal
  state and promotes the next queued item in the same transaction.
- Advancement commands include the expected current-item ID. Concurrent, retried, or delayed
  commands for an older item receive a stable conflict and cannot advance the queue twice.
- Playback position is persisted on lifecycle transitions for now. A newly promoted item starts
  at zero; an empty queue returns the active room to idle while retaining the final known position.
- Realtime snapshots now identify the authoritative current queue item directly. Each successful
  transition increments the room version, so existing live clients receive the new playback and
  queue state without refresh.
- KARA-008 required no migration because the room playback fields and queue terminal states were
  introduced by the existing room and queue migrations.
- KARA-009 loads the official YouTube IFrame Player API only on the host room. Guests continue to
  receive playback metadata through realtime snapshots and never load the video player.
- Host controls provide play, pause, restart, skip, and local volume. Volume is intentionally
  browser-local and is not written to room state or synchronized to guests.
- Autoplay remains browser-driven rather than a room preference. A prominent Start Playback action
  appears when a queued item is ready or the embedded player needs a host interaction.
- YouTube playing and paused events synchronize state and position against the loaded queue-item
  ID. Ended and player-error events atomically complete or fail that item and promote the next one.
  Stale events receive the existing conflict response and cannot overwrite a newer current item.
- Restart seeks the current player to zero and reconciles that position without changing queue
  order or creating an item. Every server-state-changing player command requires the host cookie.
- KARA-009 required no database migration.
- KARA-010 lets an authenticated host remove any upcoming item from the shared queue while guest
  requests continue to enforce ownership. Both paths lock the room before the item, reject current
  and terminal items, and stop accepting removals after the room ends or expires.
- Host skip uses the expected-current-item playback command from KARA-008, so repeated and
  conflicting requests cannot advance twice. The host player already exposes this control.
- Ending a room now locks and authenticates the room in one transaction, marks any current item
  skipped, clears the authoritative current item, resets playback to idle, and increments the room
  version. Live host players stop when the terminal room snapshot arrives.
- Realtime snapshots include the latest terminal queue activity. Connected clients receive a
  visible, assistive status message when a song is removed, skipped, completed, or fails.
- KARA-010 required no database migration.
