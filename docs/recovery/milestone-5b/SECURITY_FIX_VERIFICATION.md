# Security Fix Verification

| Defect | Before | Change | Test | Final status |
|---|---|---|---|---|
| Notification ownership | ID mutations were not consistently user-scoped | Repository reads and updates require both notification ID and authenticated user ID | Owner, cross-user, invalid-ID, and unauthenticated cases | Resolved |
| Notification route order | `:id` could consume `read-all` | Exact `read-all` route precedes regex-constrained ID routes | Route-order regression assertion | Resolved |
| Notification count contract | Backend/mobile names differed | Canonical response is `data.count` | Contract assertion | Resolved |
| Sync persistence | Storage wiring prevented reliable restore | Injected storage core reads/writes/clears state safely | First write, restart, failure, malformed data | Resolved |
| OAuth/auth logging | Debug output could expose callback/session material | Removed callback, parameter, token, header, claim, and session logging | Static prohibited-log assertions | Resolved |
| AI logging | Client logged raw conversation response | Removed raw response logging; safe error classification remains | Static prohibited-log assertion | Resolved |
| Plain auth-token duplication | Naero serialized authenticated session material to AsyncStorage | Supabase uses SecureStore; legacy records migrate and are deleted; refresh token is excluded from Naero serialization | Migration, restore, logout, serialization tests | Resolved |
| Release debug signing | Release used the debug keystore | Release consumes external credentials and release tasks fail closed if incomplete | Gradle debug/release dry runs and source test | Resolved |
| Excess Android permissions | Transitive declarations could survive merging | Explicitly removed storage, overlay, advertising, and install-referrer permissions | Release merged-manifest inspection | Resolved |
| Android backup exposure | Backup policy was permissive | `allowBackup=false` plus full exclusion rules for cloud/device transfer | Source test and merged-manifest inspection | Resolved |
| Root dependency advisories | 27: 15 high, 12 moderate | Compatible patches reduced exposure without forced upgrades | npm audits | Partially resolved; 22 deferred |

The static credential review found no tracked private key, keystore, password, service-role credential, or committed environment file. Token field names remain where required for in-memory protocol handling and in regression tests; no token values are logged or deliberately placed in ordinary AsyncStorage.
