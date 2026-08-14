# KARA-015 — Home and host-room UI refinement

## Status

Complete.

## Summary

Refine the home and host-room layouts so the landing page has lightweight product navigation and
the host display uses the full TV viewport with a player-focused left column and consolidated room
actions on the right.

## Dependencies

- KARA-004 — Host lobby and room joining display
- KARA-009 — TV player and host playback controls
- KARA-011 — Synchronized TV room experience

## Scope

- Add a home-page navbar with a Karaokey wordmark on the left and an accessible GitHub repository
  link on the right.
- Build the wordmark from the existing product name and music icon rather than introducing a new
  image asset.
- Make the active host-room layout occupy the full dynamic viewport height on TV displays.
- Prevent the global footer from adding overflow to the host-room viewport while keeping the
  privacy notice accessible from the room.
- Remove the duplicated host-room heading and room-code summary above the main two-column layout.
- Keep the left column focused on the YouTube player and its required loading, idle, unavailable,
  and terminal overlays.
- Make the right sidebar a full-height flex column at TV widths.
- Keep current-song details, playback status, Start Playback, Play/Pause, Restart, Skip, Volume, and
  playback feedback above the queue so the host does not scroll to reach playback controls.
- Reduce the Now Playing typography and spacing so it does not consume a disproportionate share of
  the queue region.
- Give the Shared Queue region the sidebar's remaining height and scroll its contents internally
  when needed.
- Move recent terminal activity out of Up Next and present it as a compact visible and assistive
  status near the playback controls.
- Replace the expanded Invite Singers content with a compact panel that keeps the room code visible
  and opens the QR code and joining instructions in an accessible dialog.
- Keep Invite Singers, Privacy, and End Room reachable outside the queue's scrolling region.
- Preserve a player-first stacked layout on narrow viewports.

## Acceptance criteria

1. The home page displays a Karaokey wordmark at the left of its navbar and an icon-only link to
   `https://github.com/jasonlerit/karaokey` at the right.
2. The GitHub link has an accessible name, visible keyboard focus, and safe external-link behavior.
3. At supported landscape TV sizes, the host room fits within `100dvh` without an initial page
   scroll caused by its outer layout or the global footer.
4. The host room does not repeat its title or room code above the player-and-queue layout; joining
   information and the room code remain available in the right column.
5. The left column contains the YouTube player without separate playback details or control rows
   around it, while required player overlays remain legible and actionable.
6. At TV widths, the right column fills the available height and keeps playback controls at the top,
   followed by compact recent activity when present, an internally scrolling queue that consumes
   the remaining height, compact invitation access, and the final Privacy and End Room actions.
7. Play/Pause, Restart, Skip, Volume, conditional Start Playback, recovery, and host authorization
   behavior continue to satisfy KARA-009.
8. The host room retains an accessible privacy-notice link without increasing the TV layout beyond
   the dynamic viewport height.
9. The Now Playing treatment uses compact typography and spacing, while recent terminal activity is
   not rendered as part of the Up Next list.
10. Existing idle, active, loading, offline, playback-error, ended, and expired states remain clear
    after the layout changes.
11. The compact Invite Singers panel keeps the room code visible and opens a dialog containing a
    large QR code and concise instructions; the dialog traps focus, closes with standard keyboard
    interactions, and restores focus to its trigger.
12. On narrow viewports, the player appears before the sidebar content, with no loss of keyboard or
    touch access and no forced full-height queue region.

## Out of scope

- A custom logo or other new brand assets.
- Changes to room, queue, playback, moderation, or authorization behavior.
- Changes to guest joining, song search, or queue layouts.
- Removal of any host playback capability required by KARA-009.
- Formal release-candidate validation deferred under KARA-014.

## PRD traceability

This spec refines FR-45 while preserving FR-29–FR-35, FR-41–FR-44, the TV UX requirements, and MVP
acceptance criteria 4 and 6.
