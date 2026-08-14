# Karaokey Product Requirements Document

## Document status

- **Product:** Karaokey
- **Version:** 1.0
- **Status:** Draft
- **Target release:** MVP
- **Last updated:** August 13, 2026

## 1. Product summary

Karaokey is an anonymous, browser-based karaoke queue for in-person groups. One person opens a room on a TV or TV-connected device and becomes the host. The TV displays the currently playing YouTube karaoke video on the left and the upcoming song queue on the right.

Guests scan a QR code with their phones to join the room without creating an account. From their phones, they can search for songs and add selections to the shared queue. Queue and playback changes appear across all connected devices in real time.

## 2. Problem

Karaoke gatherings often rely on one person to search for every song, manually track requests, and manage playback. This interrupts the event, creates confusion about whose turn is next, and concentrates control around a single device.

Karaokey separates playback from song selection: the TV remains the shared display while each guest uses their own phone to browse and submit songs.

## 3. Goals

- Let a host create and display a karaoke room in under one minute.
- Let guests join by scanning a QR code without signing up.
- Let guests search YouTube for karaoke songs and add them to a shared queue.
- Keep the TV player and every guest's queue synchronized in real time.
- Give the host enough control to keep the event moving.
- Minimize the personal data collected and retained by the product.

## 4. Non-goals for MVP

- User accounts, profiles, passwords, or social login.
- Persistent song history, favorites, playlists, or cross-room identity.
- Native iOS, Android, or smart TV applications.
- Microphone input, vocal recording, scoring, pitch detection, or lyrics generation.
- Video hosting, downloading, transcoding, or removal of YouTube advertising.
- Paid reservations, subscriptions, tipping, or other payments.
- Public room discovery or remote karaoke between different venues.
- Advanced moderation such as guest banning across rooms.

## 5. Users and roles

### Host

The person operating the TV or TV-connected browser. A host can create and end a room, control playback, and manage the queue. The host does not need an account, but receives a temporary host credential stored on the host device.

### Guest

A participant using a phone. A guest joins using the room QR code or link, chooses a temporary display name, searches for karaoke videos, and adds songs to the queue. A guest does not need an account.

## 6. Assumptions

- The host device can run a modern browser and play embedded YouTube videos with audio.
- Host and guest devices have internet access; they do not need to share the same local network.
- YouTube is the only video catalog and playback provider in the MVP.
- “Anonymous” means no account and no durable public identity. Short-lived technical data such as room credentials, session identifiers, rate-limit data, and operational logs may still be processed.
- The room is intended for people physically present together. Possession of the room link allows a guest to join until the room ends.

## 7. Core user journeys

### 7.1 Create and display a room

1. The host opens Karaokey on the TV and selects **Create room**.
2. The system creates a room with a short room code, guest URL, QR code, and temporary host credential.
3. The TV enters the room screen and prominently displays the room code and an **Invite singers**
   action.
4. The host opens the invitation dialog, and guests scan its QR code and begin adding songs.
5. The host starts playback when the first song is ready, or the room starts it automatically if autoplay is enabled and browser playback rules allow it.

### 7.2 Join from a phone

1. A guest scans the QR code or opens the guest link.
2. The room is validated as active.
3. The guest enters a temporary display name.
4. The guest sees the current song, queue, and song search.
5. The guest remains identified only for that room and browser session.

### 7.3 Search and add a song

1. A guest enters a song title, artist, or both.
2. Karaokey requests matching videos through the YouTube API.
3. Results show thumbnail, title, channel, and duration when available.
4. The guest selects a result and confirms **Add to queue**.
5. The song is appended to the queue with the guest's display name.
6. All connected screens receive the updated queue in real time.

### 7.4 Play through the queue

1. The TV shows the active video on the left and the ordered queue on the right.
2. The current singer and song are clearly highlighted.
3. When the video ends, Karaokey advances to the next queued song.
4. The host can play, pause, restart, skip, or remove a queued song.
5. Queue and playback state changes are reflected on guest devices.

### 7.5 End or expire a room

1. The host selects **End room** and confirms.
2. Playback stops, the room is closed to new guests, and connected guests see that the session ended.
3. The system deletes or expires room data according to the retention policy.
4. An inactive room also expires automatically after the configured inactivity period.

## 8. Functional requirements

### 8.1 Room management

- **FR-1:** A user can create a room without an account.
- **FR-2:** Each room has a non-sequential, hard-to-guess guest URL and a short human-readable room code.
- **FR-3:** The system generates a QR code containing the guest URL.
- **FR-4:** The host receives a secret room-management credential that is not included in the guest URL.
- **FR-5:** Reopening the room on the same host browser restores host controls while the credential remains valid.
- **FR-6:** The host can end the room explicitly.
- **FR-7:** An inactive room expires automatically. The proposed MVP default is six hours after the last room activity, with an absolute maximum lifetime of twelve hours.
- **FR-8:** Joining an expired or ended room shows a clear message and an option to return home.

### 8.2 Guest identity

- **FR-9:** A guest can join without an account, email address, or phone number.
- **FR-10:** A guest chooses a display name before adding a song.
- **FR-11:** Display names are validated for length and unsafe content. The proposed limit is 1–24 visible characters.
- **FR-12:** The system assigns the guest a temporary, room-scoped session identifier.
- **FR-13:** Duplicate display names are allowed but are internally distinguishable by session identifier.

### 8.3 Search and YouTube integration

- **FR-14:** Guests can search by song title, artist, or keywords.
- **FR-15:** Search results are supplied by the YouTube Data API and prioritize embeddable videos suitable for playback.
- **FR-16:** Search results display enough metadata to distinguish versions, including title, channel, thumbnail, and duration when available.
- **FR-17:** The system validates that a selected video is available and embeddable before adding it when the API permits.
- **FR-18:** Empty, loading, quota-exceeded, unavailable-video, and general error states provide actionable feedback.
- **FR-19:** Search input is debounced or explicitly submitted to control API usage.

### 8.4 Queue

- **FR-20:** A guest can add a selected video to the end of the active room's queue.
- **FR-21:** Each queue item contains a stable item ID, YouTube video ID, title, thumbnail, duration when available, requester display name, status, and creation time.
- **FR-22:** Queue order is determined by the server to prevent conflicting simultaneous additions.
- **FR-23:** The same video may be requested by different guests unless the room's duplicate policy rejects it.
- **FR-24:** The proposed MVP limits are three queued songs per guest and fifty total queued songs per room.
- **FR-25:** A guest can remove their own queued song before it begins playing.
- **FR-26:** The host can remove any upcoming item and skip the current item.
- **FR-27:** A removed, skipped, failed, or completed item does not return to the active queue automatically.
- **FR-28:** If a video becomes unavailable, the system marks it failed, informs the room, and advances safely.

### 8.5 Playback and host controls

- **FR-29:** The host screen embeds the current video using the supported YouTube player integration.
- **FR-30:** Host controls include play, pause, restart, skip, and volume.
- **FR-31:** Only a valid host credential can invoke host-only controls.
- **FR-32:** When a video completes, the next valid queue item becomes current.
- **FR-33:** If browser autoplay is blocked, the host sees a prominent **Start playback** control.
- **FR-34:** Playback changes made outside Karaokey's controls, where detectable, reconcile with the server's room state.
- **FR-35:** When the queue becomes empty, the player returns to an idle state without ending the room.

### 8.6 Real-time synchronization

- **FR-36:** Clients receive room, queue, presence, and playback-state changes without manual refresh.
- **FR-37:** Server state is authoritative for queue order and the current queue item.
- **FR-38:** A reconnecting client fetches a fresh snapshot before processing subsequent live events.
- **FR-39:** Temporary disconnection is visible to the user and reconnects automatically with bounded backoff.
- **FR-40:** Duplicate or retried add-to-queue requests are idempotent.

### 8.7 TV experience

- **FR-41:** During playback, the video occupies the left side of the TV layout and the queue occupies the right side.
- **FR-42:** The queue panel shows the current singer, upcoming singers, song titles, and clear ordering.
- **FR-43:** The QR code and room code remain accessible without permanently obscuring playback; they may appear in the queue panel or a host-triggered overlay.
- **FR-44:** The interface remains legible at common 16:9 TV resolutions and from across a room.
- **FR-45:** An idle room prominently displays the room code and an **Invite singers** action that
  opens a dialog with a large QR code and simple joining instructions.

### 8.8 Guest mobile experience

- **FR-46:** The guest experience is optimized for narrow touch screens.
- **FR-47:** Guests can see what is playing, their own upcoming requests, and the shared queue position.
- **FR-48:** Adding or removing a song provides immediate confirmation and prevents accidental duplicate submissions.
- **FR-49:** Search and queue actions remain usable with normal mobile browser zoom and accessible text sizing.

## 9. Queue and playback rules

The MVP uses first-in, first-out ordering. New requests are appended to the end of the queue. The server assigns each accepted request its position atomically.

Recommended fairness and safety defaults:

- Maximum of three upcoming songs per guest.
- Maximum of fifty upcoming songs per room.
- Reject the exact same video if it is already current or queued for the same guest.
- Allow the same song or video from another guest because group repeats may be intentional.
- Only the host can reorder songs in a future release; drag-and-drop reordering is not required for MVP.
- When the current item finishes or is skipped, select the earliest valid queued item in one server-authoritative operation.

## 10. UX requirements

### TV layout

- Use a landscape-first two-column layout, with approximately 70% of the width for the video and 30% for the queue.
- Keep the current song and singer visible near the player or at the top of the queue.
- Show at least the next three requests when space permits.
- Keep core host controls usable with a mouse, touchpad, or TV-connected touch display.
- Avoid small controls and low-contrast text.

### Phone layout

- Place song search as the primary action.
- Use a compact tab or segmented navigation for **Search** and **Queue** if both do not fit comfortably on one screen.
- Clearly label the requesting guest on every queue item.
- Preserve the guest's display name and room session across page refreshes on the same browser.

### Accessibility

- All interactive controls are keyboard accessible and have visible focus states.
- Icon-only controls have accessible names.
- Status changes such as “song added” or “room ended” are announced to assistive technology where appropriate.
- Text and controls meet WCAG 2.2 AA contrast targets.
- The experience does not rely on color alone to communicate queue status.

## 11. Data model

The exact schema is an implementation decision, but the product requires these entities:

### Room

- Room ID
- Public room code and join token
- Hashed host credential
- Status: active, ended, or expired
- Current queue item ID
- Playback state and last known playback position
- Created, last-active, and expiration timestamps

### Guest session

- Session ID
- Room ID
- Display name
- Created and last-seen timestamps

### Queue item

- Queue item ID
- Room ID
- Guest session ID and display-name snapshot
- YouTube video ID and display metadata
- Server-assigned position or ordering key
- Status: queued, playing, completed, skipped, removed, or failed
- Created, started, and finished timestamps as applicable

Persistent personal profiles are not required. Raw host credentials must not be stored server-side.

## 12. Privacy, security, and abuse prevention

- Do not require or solicit names beyond a temporary display name, email addresses, phone numbers, or social accounts.
- Store only the minimum room and operational data needed to provide and protect the service.
- Delete or anonymize expired room, guest, and queue data after a short documented retention window. The proposed MVP target is within 24 hours of room expiration.
- Treat room links and host credentials as secrets, use sufficient entropy, and never expose the host credential to guest clients.
- Validate and normalize all user input at the server boundary.
- Escape user-supplied display names in every rendered context.
- Rate-limit room creation, joining, search, and queue mutations by appropriate short-lived identifiers.
- Prevent guests from invoking host-only actions through server-side authorization checks.
- Avoid logging room credentials, full guest URLs, or unnecessary identifying data.
- Provide a host action to remove abusive queue items and end a compromised room.
- Publish a concise privacy notice explaining anonymous sessions, temporary data, operational logs, and third-party YouTube processing.

## 13. YouTube platform requirements and constraints

- Use official YouTube APIs and supported embedded-player functionality.
- Follow current YouTube API Services Terms of Service, Developer Policies, branding rules, and player requirements.
- Do not download, cache, modify, obscure, or separately extract video or audio streams.
- Plan for Data API quota limits by debouncing searches, caching allowed metadata appropriately, and avoiding unnecessary requests.
- Expect some videos to be unavailable, age-restricted, region-restricted, private, removed, or blocked from embedding.
- Do not promise uninterrupted or ad-free playback.
- Browser and device autoplay rules may require an initial host interaction before audio playback begins.
- The product must degrade gracefully when YouTube search, metadata, or playback is unavailable.

Before production launch, the team must validate the final implementation against the then-current YouTube policies and quota allocation.

## 14. Non-functional requirements

### Performance

- The initial TV and guest screens should become interactive within 3 seconds at the 75th percentile on a typical broadband or 4G connection, excluding third-party video startup.
- An accepted queue mutation should appear on connected clients within 1 second at the 95th percentile under normal conditions.
- Search should show a loading state within 100 milliseconds and return results as quickly as the YouTube API permits.

### Reliability

- Queue additions and playback advancement must be atomic and resilient to concurrent requests.
- A client reconnect must not duplicate queue items or roll back a newer server state.
- Failure to play one video must not prevent subsequent queue items from playing.
- Target 99.5% monthly availability for room and queue functionality in the MVP.

### Compatibility

- Support the latest two stable major versions of Chrome, Safari, Edge, and Firefox where YouTube embedding is supported.
- Support common iOS and Android mobile browser viewport sizes.
- Optimize the host display for 16:9 screens at 1280×720 and above.

### Observability

- Record privacy-conscious operational events for room creation, join success, search failure, queue mutation failure, playback failure, reconnects, and room expiration.
- Monitor YouTube quota usage and API error categories.
- Do not include guest-entered names, credentials, or full room links in analytics events.

## 15. Success metrics

MVP success should be evaluated using aggregated, privacy-conscious metrics:

- At least 80% of created rooms receive one guest join.
- At least 70% of rooms with a guest receive one queued song.
- At least 90% of accepted queue additions appear on the host screen within 1 second.
- At least 95% of playable songs advance to the next item without manual recovery.
- Median time from room creation to first guest join is under 2 minutes.
- Fewer than 5% of active rooms end because of an unrecoverable application error.

## 16. MVP acceptance criteria

The MVP is ready when all of the following are true:

1. A host can create a room without signing in and receives a working QR code and room code.
2. A guest can scan the QR code, choose a temporary display name, and join from a phone without signing in.
3. A guest can search YouTube and add a valid, embeddable video to the room queue.
4. The TV shows the current video on the left and the synchronized song queue on the right.
5. Multiple guests can add songs concurrently without losing, duplicating, or incorrectly ordering accepted requests.
6. The host can play, pause, restart, skip, remove a queued item, and end the room.
7. Completing or skipping a song advances to the next valid queued item.
8. Guests can remove their own upcoming requests but cannot use host controls or remove other guests' requests.
9. Refreshing or briefly disconnecting a client restores the current room state without duplicate actions.
10. Expired and ended rooms cannot accept new joins or queue mutations.
11. Unavailable videos and YouTube API failures produce clear error states and do not permanently stall the queue.
12. The application passes its automated formatting, lint, type, and relevant test checks.

## 17. Suggested delivery phases

### Phase 1: Room foundation

- Anonymous room creation and joining
- Host credential and guest sessions
- QR code and room code
- Room expiration
- Real-time connection and room snapshot

### Phase 2: Search and queue

- YouTube search and video validation
- Queue add and remove actions
- Concurrency, limits, and idempotency
- Synchronized TV and guest queue views

### Phase 3: Playback

- YouTube embedded player
- Host controls and authorization
- Automatic queue advancement
- Unavailable-video recovery
- Idle and reconnect states

### Phase 4: Hardening and launch

- Accessibility and responsive testing
- Rate limits and abuse controls
- Privacy notice and data cleanup
- Cross-browser and TV testing
- YouTube policy and quota review
- Production monitoring

## 18. Risks and mitigations

| Risk                                     | Impact                            | Mitigation                                                                                           |
| ---------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| YouTube quota exhaustion                 | Guests cannot search              | Debounce and cap search, cache permitted metadata, monitor quota, and define a clear degraded state  |
| Video cannot be embedded or played       | Queue stalls                      | Validate when possible, detect player errors, mark the item failed, and allow skip/automatic advance |
| Browser blocks autoplay                  | First song does not start         | Require a clear host interaction to initialize playback                                              |
| Room link is shared outside the venue    | Spam or unwanted requests         | Use hard-to-guess tokens, queue limits, rate limits, host removal, and room termination              |
| Simultaneous updates corrupt queue order | Lost or duplicated requests       | Use server-authoritative atomic ordering, transactions, and idempotency keys                         |
| Host refreshes or loses connection       | Playback control is interrupted   | Persist the host credential locally and restore state from the server                                |
| Anonymous usage enables abuse            | Offensive names or queue flooding | Validate names, limit actions, rate-limit sessions, and give the host moderation controls            |
| Third-party policy changes               | Integration becomes non-compliant | Review current YouTube requirements before launch and periodically thereafter                        |

## 19. Open product decisions

These decisions should be resolved before implementation reaches feature-complete status:

1. Should the first queued song start only after the host presses play, or should the room offer an autoplay preference?
2. Can the host reorder the queue in MVP, or are remove and skip sufficient?
3. Should guests see the entire queue or only the current song and their own position?
4. Is a typed room code required as a fallback to QR joining at launch?
5. What exact inactivity timeout and post-expiration retention period should production use?
6. Should search automatically add “karaoke” to queries, offer a karaoke-only filter, or leave queries unchanged?
7. Should duplicate songs be allowed for different guests by default?
8. Is guest presence count needed, and should disconnected guests remain visible?
9. What content-safety controls are required beyond host removal and rate limiting?

## 20. Future opportunities

- Host queue reordering and per-room queue rules.
- Round-robin mode to prevent one guest from occupying consecutive turns.
- Guest voting or reactions.
- Optional room PINs and host handoff or recovery.
- Saved playlists and favorites if optional accounts are introduced later.
- Additional licensed karaoke catalogs.
- Casting and native TV support.
- Singer rotation, duet requests, and “sing again” actions.
- Venue administration and reusable rooms.
