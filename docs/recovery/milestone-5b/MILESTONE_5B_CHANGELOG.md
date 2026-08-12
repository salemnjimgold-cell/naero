# Milestone 5B Changelog

Starting point: `be5007cc2a1adc074efdc549581fa43241a5c799` on preserved branch `recovery/milestone-4b-baseline`.

## Changes

- Enforced notification ownership in repository reads and mutations, made `read-all` unambiguous, and standardized unread counts as `{ "data": { "count": number } }`.
- Restored sync-state persistence and defensive handling of missing, malformed, and failed storage operations.
- Moved Supabase session persistence to Expo SecureStore, added one-time legacy migration/removal, stopped Naero's duplicate refresh-token persistence, and removed sensitive OAuth/auth/AI logging.
- Removed debug signing from the release variant. Release tasks require externally supplied credentials and fail closed when they are absent.
- Minimized Android permissions and disabled backup while supplying explicit modern and legacy exclusion policies.
- Applied compatible non-forced dependency patches without changing Expo SDK 54 or React Native 0.81.5.
- Added four focused Milestone 5B regression suites.

No production credentials, database changes, product features, or remote pushes were made.
