# Primary Surface State Matrix

Legend: each cell names required behavior; no blank means “not applicable.”

| State | Home | Discover | Plan | My Naero | Ask Naero |
|---|---|---|---|---|---|
| Loading | Context + Help remain; module skeletons | Search/context remain; result skeletons | Plan shell/item skeletons | Section skeletons | Composer stays; cancelable response state |
| Success | Real finite modules | Classified results | User-selected items/status | Context/activity/controls | Answer + sources/actions |
| Empty | Setup/intent action | Change query/category/city | Start Plan explanation | Context plus useful empty collections | Suggested intents, no fake history |
| Error | Preserve cached modules; retry | Preserve prior results; scoped retry | Preserve local state; queue/retry | Per-section error | Preserve prompt/context; retry |
| Offline | Saved/cached with age | Cached/saved with age | Cached items; queue state change | Local content and sync status | Reviewed local fallback or unavailable |
| Guest | Full basic utility; local continuity | Public results/local saves | Local plan + sync explanation | Guest/data-on-device state | Allowed within capability/rate policy |
| Authenticated | Synced legitimate resume | Synced saves | Synced plan/conflicts visible | Account/security/sync | Account context only if visible/allowed |
| Location enabled | Nearby module | distance/map/radius | Optional nearby actions | Device mode shown | Coordinates only for explicit nearby ask |
| Manual city | City essentials | city results; no false proximity | City-scoped content | Manual mode shown | Selected city, not precise location |
| Location off | Generic/context setup | manual/global search | Non-proximity plan works | Off state and controls | No location inherited |
| No nearby results | Explain radius; alternatives | radius/category/city actions | Item remains, place action fallback | — | Explain no verified result |
| Stale information | Cannot drive Next Step | Warning/age/source | Warning; review before action | Saved item age | Cite stale status and safer verification |
| Unsupported jurisdiction | Global utility, transparent gap | external results if available | No governed plan; waitlist/info | selected context retained | General help with explicit limits |

Authentication and location are orthogonal; every combination is supported. State precedence: urgent safety access → privacy/context truth → offline/stale warning → content state.
