# Release readiness

Last reviewed: 2026-08-14

KARA-014 is complete only after every release gate below has evidence from the release candidate.
Repository checks cover deterministic behavior; they do not substitute for real browsers, devices,
production-like latency, or the YouTube project owner's quota review.

## Operational contract

- `GET /api/health/live` confirms the application process can serve requests.
- `GET /api/health/ready` confirms the process can query PostgreSQL. Both probes are uncached and
  disclose no dependency details.
- Set `OBSERVABILITY_ENABLED=true` to emit one-line JSON events. Events contain only a timestamp,
  a fixed category, bounded outcomes, and aggregate counts. They never contain room or guest IDs,
  names, tokens, credentials, search text, video IDs, URLs, or IP addresses.
- Alert on readiness failures, elevated failure-event rates, YouTube quota errors, and an absence of
  scheduled `retention_cleanup` events. Retain these application events for no more than seven days.
- Define room/queue availability as successful non-rate-limited room reads and accepted queue
  mutations over all eligible attempts in a calendar month. The target is 99.5%; exclude planned
  maintenance and YouTube playback itself, which is an external service.
- Define playback advancement reliability as successful authoritative transitions divided by all
  valid start/advance commands. Track unavailable-video failures separately.

The Google Cloud project owner must also monitor the YouTube Data API quota dashboard. Application
events classify requests and quota failures but are not the quota system of record.

## Automated release gate

Run against the release commit with production environment validation enabled:

```sh
npm run check
npm test
npm run build
```

The Node test suite covers queue limits and ordering policy, stale playback and recovery decisions,
authorization credentials, room expiration and retention cutoffs, reconnect backoff and stale
snapshot rejection, rate limits, display-name validation, and unavailable-video/player states.
Database serialization and HTTP/cookie authorization are additionally exercised during the manual
critical journeys below. Record the commit SHA and command output in the release record.

## Accessibility and viewport gate

Test with keyboard only and with VoiceOver on Safari or NVDA on Firefox. Confirm visible focus,
logical focus order, descriptive names, 200% zoom without lost controls, and announced join,
search, queue, playback, terminal-room, and reconnect states. Verify contrast with an automated
WCAG 2.2 AA checker and confirm every status includes text rather than relying on color.

Exercise guest flows at 320×568, 390×844, and 412×915 CSS pixels. Exercise host flows at 1280×720,
1920×1080, and one stacked/narrow viewport. At each size, create/join a room, search, add/remove a
request, start/pause/restart/skip playback, reconnect, handle an unavailable video, and end the room.

## Browser gate

Record the exact browser versions and results at release time; “latest two” moves over time.

| Surface       | Required browsers                                                                          | Status  |
| ------------- | ------------------------------------------------------------------------------------------ | ------- |
| Host          | Latest two stable Chrome, Safari, Edge, and Firefox versions where YouTube embedding works | Not run |
| Guest iOS     | Latest two stable iOS Safari versions                                                      | Not run |
| Guest Android | Latest two stable Android Chrome versions                                                  | Not run |

## Performance gate

Use a production build, a production-like PostgreSQL instance, typical broadband for host flows,
and a throttled 4G profile for guest flows. Run at least 30 cold samples per surface and 100 queue
mutations. Record raw results and p75/p95 values.

- Initial interactive: navigation start until the first enabled primary control responds; target
  under 3 seconds p75, excluding YouTube video startup.
- Queue propagation: successful mutation response until the changed authoritative snapshot is
  rendered by a second connected client; target under 1 second p95.
- Search feedback: submit activation until visible loading feedback is painted; target under 100ms.

Any miss requires a documented owner-approved exception with result, user impact, mitigation, and
expiry date. Current status: not measured on a release candidate.

## YouTube release review

The 2026-08-14 code review verified use of the official IFrame Player API, an origin parameter, a
referrer policy that preserves the origin, public/embeddable video validation, visible YouTube
attribution in search/player UI, no media downloading or audio separation, and links to the YouTube
Terms of Service and Google Privacy Policy. The player retains standard controls and related-video
behavior.

Immediately before production launch, the Google Cloud project owner must record:

- review date, reviewer, release commit, API project, and approved domains;
- acceptance against the current YouTube API Terms, Developer Policies, Required Minimum
  Functionality, branding rules, and IFrame API requirements;
- current daily quota allocation, measured worst-case request budget, alerts, and headroom;
- successful playback of an embeddable video plus unavailable, embedding-disabled, and quota-error
  behavior.

Official sources: [YouTube API Terms](https://developers.google.com/youtube/terms/api-services-terms-of-service),
[Developer Policies](https://developers.google.com/youtube/terms/developer-policies),
[Required Minimum Functionality](https://developers.google.com/youtube/terms/required-minimum-functionality),
[IFrame Player API](https://developers.google.com/youtube/iframe_api_reference), and
[quota/compliance audits](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits).

Release-time policy and quota status: not approved.
