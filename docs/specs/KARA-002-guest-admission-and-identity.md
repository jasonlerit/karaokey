# KARA-002 — Guest admission and room-scoped identity

## Summary

Allow a guest to enter an active room without an account, choose a temporary display name, and receive a room-scoped browser session that survives refreshes without creating a durable public identity.

## Dependencies

- KARA-001 — Anonymous room lifecycle and host authority

## Scope

- Resolve and validate an active room from its join token and, if supported, typed room code.
- Validate and normalize display names at the server boundary.
- Create a unique guest session associated with exactly one room.
- Restore the same guest session and display name on refresh in the same browser while valid.
- Permit duplicate display names while retaining distinct session identifiers.
- Update guest last-seen information without collecting account, email, or phone data.
- Show actionable ended, expired, invalid, and unavailable room states.

## Acceptance criteria

1. A guest can join an active room without signing in or supplying contact information.
2. A guest must establish a valid display name before performing guest queue mutations.
3. Names outside the configured visible-character limit or containing disallowed input are rejected with actionable feedback.
4. Two guests can use the same display name and still receive different room-scoped session identifiers.
5. Refreshing the page in the same browser restores the guest session and display name.
6. A session issued for one room cannot mutate another room.
7. Ended, expired, and invalid rooms cannot create or restore an active guest session.

## Out of scope

- Accounts, cross-room identity, profiles, and guest banning.
- Queue mutations and presence broadcasting.

## Open decisions

- Confirm the proposed 1–24 visible-character limit.
- Define Unicode normalization, whitespace, emoji, control-character, and unsafe-content rules.
- Decide whether room codes can be entered from the home page or are display-only.

## PRD traceability

FR-8–FR-13; journey 7.2; Guest session data model; phone display-name persistence; MVP acceptance criteria 2, 8, and 10.
