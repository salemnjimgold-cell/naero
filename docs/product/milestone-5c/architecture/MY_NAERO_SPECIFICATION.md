# My Naero Specification

## Purpose

My Naero is the user’s context, continuity and control center—not a social profile.

## Hierarchy

1. **My context:** country/city, location mode and language, each editable.
2. **My activity:** active Plan, saved places/guidance, and recent useful actions with clear retention behavior.
3. **Preferences:** languages, accessibility, privacy, AI context/history and notifications.
4. **Account:** guest/account state, authentication, security, sync and data controls.
5. **About and support:** help, source policy, report issue, terms, privacy and app version.

Names/photos are optional and appear only if they improve account recognition. Followers, public biographies and achievement counts do not belong here.

## Guest behavior

- Show “Using Naero as guest” and which data remains on device.
- Local saved items and Plans remain usable.
- “Sign in to sync across devices” is contextual and never blocks viewing/export/deletion.
- Clear local data requires explicit confirmation and explains scope.

## Authenticated behavior

- Show account identifier, sync status and last successful sync.
- Provide sign out, session/security management and delete/export request entry points when supported.
- Signing out explains which device-local preferences remain and removes sensitive session material.

## States

Section-level skeletons; independent retry per failed remote section; offline access to local context/saves; honest empty-state actions. Unsupported setting rows are not displayed. RTL uses logical grouping and mirrored navigation controls; all preference states are announced to screen readers.
