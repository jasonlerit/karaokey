# KARA-016 — Immersive host playback

## Status

Complete.

## Summary

Maximize the YouTube player and usable queue area on the 960×540 host display while automatically
attempting the first valid playback transition and retaining a safe browser-interaction fallback.

## Dependencies

- KARA-008 — Server-authoritative playback lifecycle
- KARA-009 — TV player and host playback controls
- KARA-010 — Host queue moderation and room control
- KARA-011 — Synchronized TV room experience
- KARA-012 — Playback and integration failure recovery
- KARA-015 — Home and host-room UI refinement

## Scope

- Remove the outer host card, maximum-width constraint, border, radius, shadow, and page padding so
  the two-column room uses the full dynamic viewport.
- Use an approximately 75/25 player/sidebar split with a sidebar minimum near 15rem at the 960px TV
  breakpoint.
- Make the entire left column a full-height black player stage and center the largest possible
  aspect-correct YouTube player without stretching or cropping video.
- Automatically issue one guarded start request when the host observes an active idle room with a
  queued item.
- Retain Start playback when the browser blocks autoplay or otherwise requires host interaction.
- Remove visible previous-song activity from the host TV while preserving its live assistive
  announcement.
- Remove visible Playing/Paused text and divide Play/Pause, Restart, Skip, and End Room evenly across
  the playback-control row.
- Reduce TV-specific queue and Invite Singers typography and spacing while preserving accessible
  names, touch targets, and at least three visible upcoming songs when present and space permits.
- Keep the Shared Queue as the only internally scrolling host-sidebar section.

## Acceptance criteria

1. At 960×540 and wider landscape host viewports, the player stage and sidebar occupy `100dvw` by
   `100dvh` without an outer card, maximum-width cap, page padding, or initial document scrolling.
2. The player stage uses a black background and contains the largest centered 16:9 YouTube player
   that fits its available width and height; video is never stretched or cropped.
3. The TV layout uses an approximately 75/25 split and keeps the sidebar usable at a minimum width
   near 15rem.
4. When an active room is idle and gains a queued item, the host sends at most one automatic start
   request for that idle queue state.
5. Automatic start uses the existing atomic server transition, and duplicate snapshots, retries,
   or conflicts cannot promote or advance more than one item.
6. If autoplay succeeds, playback begins without a host click. If the browser blocks it, the current
   item remains valid and one prominent Start playback fallback is shown without repeated retries.
7. The playback section displays exactly four equal-width icon-first controls—Play/Pause, Restart,
   Skip, and End Room—with accessible names and confirmed room exit.
8. Playing/Paused text and visible previous-song activity do not consume sidebar space; terminal
   activity remains announced to assistive technology.
9. Shared Queue consumes the sidebar's remaining height and scrolls internally without overlapping
   the compact Invite Singers section.
10. At least three upcoming songs are visible at 960×540 when present and space permits; queue and
    invitation text remain legible from the intended TV distance.
11. Narrow layouts retain player-first document flow and visible control labels without forced
    full-viewport or 75/25 behavior.

## Out of scope

- Stretching, cropping, or replacing the official YouTube player to eliminate aspect-ratio space.
- Bypassing browser autoplay policies or synthesizing user interaction.
- Automatic playback on guest devices.
- Changes to queue ordering, limits, moderation authorization, or room retention.
- Formal release-candidate validation deferred under KARA-014.

## PRD traceability

Journey 7.1; FR-29–FR-35; FR-41–FR-45; TV UX requirements; MVP acceptance criteria 4, 6, and 7.
