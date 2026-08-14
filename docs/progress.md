# Progress

Last updated: 2026-08-14

## Current phase

UI refinement review

## Current

No active implementation

## Last completed

KARA-016 — Immersive host playback

## Next

Review KARA-016 on the target 960×540 TV viewport and capture any further UI adjustments before
starting another implementation spec.

## Blockers

None for UI refinement. KARA-014 release-candidate validation is deferred while the application is
a personal project; closing it later still requires browser/device access, production-like
performance infrastructure, and the YouTube API project owner.

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
  guest URL. The host sidebar keeps the room code and Invite Singers action visible at TV scale.
- Invite Singers opens the QR code, joining instructions, and guest link in a keyboard-accessible
  dialog that returns focus to its trigger when dismissed.
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
- Host controls provide play/pause, restart, skip, and confirmed room exit. The YouTube player
  initializes at 100% volume; subsequent volume changes use the TV or supported player controls
  and are not written to room state or synchronized to guests.
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
- KARA-011 uses an approximately 70/30 landscape grid at the TV breakpoint, with only the official
  player and its overlays on the left and the authoritative queue and host actions on the right.
  Below that breakpoint, the same content stacks without losing keyboard or touch access.
- The queue uses explicit Now Playing and position labels, requester names, larger TV typography,
  and touch-sized moderation controls. All upcoming items remain visible, including at least the
  next three when present and space permits.
- Joining information opens in a dialog from a compact sidebar panel. The room code and labeled
  trigger remain visible without taking height away from the queue.
- The player presents distinct waiting, ready, loading, ended, and expired messages. The live queue
  distinguishes connecting, live, and offline/retrying states in text and gives an actionable
  connection warning without relying on indicator color.
- KARA-011 required no database migration.
- KARA-012 bounds official YouTube Data API requests at ten seconds. Search retries one general
  availability failure automatically, while quota, configuration, invalid-query, unavailable-video,
  and empty-result states remain distinct and actionable.
- The host gives the YouTube IFrame API fifteen seconds to initialize before presenting a stable
  unavailable state with an explicit retry action. Persistent provider unavailability does not
  mutate or discard the authoritative queue.
- Each loaded current item has a fifteen-second startup deadline and one automatic reload. A
  second timeout or player error marks only that expected item failed and atomically promotes the
  next valid request. Autoplay blocking pauses recovery and asks for host interaction instead.
- Per-item retry and advancement guards combine with the expected-current-item server contract,
  so duplicate errors, late timeouts, and signals from older videos cannot advance newer items.
  Host and guest snapshots announce failed items through the existing recent-activity message.
- Realtime reconnects remain visibly bounded at fifteen seconds. Every new event stream begins
  with a fresh authoritative snapshot, and monotonic version checks reject stale or duplicate data
  without replaying client mutations.
- KARA-012 required no database migration.
- KARA-013 confirms a 24-hour retention window after a room ends or expires. Cleanup deletes the
  room and cascades to its guest sessions and queue items during ordinary room traffic and through
  a secret-protected maintenance endpoint that production must schedule at least hourly.
- Fixed-window abuse limits are five room creations per ten minutes, ten join attempts per ten
  minutes, thirty searches per minute, and twenty queue mutations per minute. Keys combine an
  operation scope with a client identifier, are SHA-256 hashed, and remain only in short-lived
  process memory. Proxy headers are ignored unless `RATE_LIMIT_TRUST_PROXY` is explicitly enabled.
- The host credential is no longer returned in room-creation JSON after it is saved in its
  protected cookie. Existing guest views expose neither host credentials nor host-only presence
  details, and ordinary database query logging remains disabled by default.
- The public `/privacy` notice covers anonymous sessions, temporary room data, YouTube processing,
  operational logs, retention, and abuse controls and is linked from every screen. Internal
  deployment requirements are recorded in `docs/privacy-and-retention.md`, including a seven-day
  maximum target for privacy-conscious operational logs.
- Existing server authorization and policy tests cover invalid host credentials, guest ownership,
  and host-only queue removal behavior. New tests cover fixed-window limits and the retention
  cutoff.
- KARA-013 required no database migration.
- KARA-014 adds privacy-bounded JSON operational events for room creation, successful joins,
  expiration and retention counts, YouTube request outcomes, queue/playback failures, and realtime
  reconnects. Events are disabled by default and their schema rejects identifiers and arbitrary
  fields.
- Uncached liveness and database-readiness probes support deployment health checks. A global
  `strict-origin-when-cross-origin` policy preserves the origin required by the YouTube embed while
  limiting referrer detail.
- The public notice now links the YouTube Terms of Service and Google Privacy Policy and records
  consent for YouTube-backed features. The player no longer customizes related-video behavior.
- `docs/release-readiness.md` defines metric boundaries, service availability, the moving browser
  matrix, test conditions, privacy limits, and a dated YouTube policy/quota checklist. Gates that
  require a release environment, real devices, or the API project owner remain explicitly unrun.
- KARA-014 required no database migration.
- KARA-014 release-candidate validation is deferred for the personal-project phase. Its implemented
  operational-readiness work remains in place, but the manual browser, device, accessibility,
  performance, and YouTube account-owner gates in `docs/release-readiness.md` have not been run and
  KARA-014 is not complete.
- KARA-015 keeps playback controls and compact recent activity above the queue. At TV widths, the
  Shared Queue region consumes the remaining sidebar height and scrolls internally; the compact
  Invite Singers panel remains reachable below it.
- The 960×540 sidebar uses an icon-first Play/Pause, Restart, Skip, and End Room row with accessible
  control names, plus denser queue headings, Now Playing details, and song rows. Explicit flex and
  overflow boundaries keep long queues inside the Shared Queue scroller instead of overlapping
  Invite Singers.
- The host playback client owns its sidebar component tree directly and receives only room values
  and the bound end-room action from the server page, avoiding unstable server-rendered child slots
  during realtime updates and React developer-tool inspection.
- The final KARA-015 sidebar has exactly three primary sections. It removes the application volume
  slider, initializes playback volume at 100%, moves confirmed End Room into the icon-first
  playback row, and retains Privacy inside the Invite Singers dialog.
- KARA-016 removes the outer host card and padding, uses an approximately 75/25 full-viewport layout,
  and gives unused aspect-ratio space a black player-stage background rather than stretching or
  cropping YouTube video.
- KARA-016 automatically attempts the first idle-to-playing transition once per idle queue state.
  Browser-blocked autoplay remains recoverable through Start playback and does not trigger repeated
  starts or discard the current item.
- KARA-016 gives the host an edge-to-edge 75/25 TV layout with a full-height black player stage,
  four equal playback controls, assistive-only terminal activity, and a denser sidebar whose Shared
  Queue is the only internally scrolling section.
- The host playback grid owns an explicit dynamic-viewport height and a bounded grid row at the TV
  breakpoint, so both the player stage and sidebar stretch to the full screen independently of
  percentage-height inheritance.
- On wider layouts, Invite Singers uses a compact two-column dialog with a 12rem QR code so its room
  code, instructions, guest link, and privacy notice fit within the 960×540 viewport even when
  browser tooling reduces the effective width; overflow scrolling remains a small-screen fallback.
- KARA-016 passed formatting, ESLint, TypeScript, all 40 Node tests, and a production webpack build.
- The home page now has a Karaokey wordmark and an accessible external GitHub repository link.
- The host room uses the full dynamic viewport at TV widths, hides the duplicate room header, keeps
  only the YouTube player and its overlays in the left column, and uses a full-height right column
  with a compact Now Playing treatment and an independently scrolling upcoming-song list.
- KARA-015 passed formatting, ESLint, TypeScript, all 37 Node tests, and a production webpack build.
  The standard Turbopack build could not run in this environment because its internal CSS worker
  was denied permission to bind a local port.
- TV testing exposed a browser that reports a 960×540 CSS viewport despite a larger physical
  panel. The host switches to its landscape player/sidebar layout at that width, and the
  idle QR panel becomes compact so the queue and joining details remain visible without an initial
  page scroll.
