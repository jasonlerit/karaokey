# KARA-015 — Home and host-room UI refinement

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
- Move the current-song details, playback status, Start Playback action, Play/Pause, Restart, Skip,
  Volume, and playback feedback below the Invite Singers panel in the right column.
- Keep End Room at the bottom of the right column.
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
6. The right column places playback details, status, controls, and feedback immediately below the
   Invite Singers panel and keeps End Room after the other room actions.
7. Play/Pause, Restart, Skip, Volume, conditional Start Playback, recovery, and host authorization
   behavior continue to satisfy KARA-009.
8. The host room retains an accessible privacy-notice link without increasing the TV layout beyond
   the dynamic viewport height.
9. On narrow viewports, the player appears before the queue, invitation panel, playback controls,
   and end-room action, with no loss of keyboard or touch access.
10. Existing idle, active, loading, offline, playback-error, ended, and expired states remain clear
    after the layout changes.

## Out of scope

- A custom logo or other new brand assets.
- Changes to room, queue, playback, moderation, or authorization behavior.
- Changes to guest joining, song search, or queue layouts.
- Removal of any host playback capability required by KARA-009.
- Formal release-candidate validation deferred under KARA-014.

## PRD traceability

This spec refines the presentation of existing requirements without changing the PRD. It preserves
FR-29–FR-35, FR-41–FR-45, the TV UX requirements, and MVP acceptance criteria 4 and 6.
