# 3B Offline, Permission and Location States

`OfflineState` distinguishes:

- offline with local features remaining
- offline with cached content available
- offline with stale cached content

It does not imply every feature is blocked. Consumers decide which local/cached actions remain active.

`PermissionState` supports canonical location, notifications, camera and generic permission contexts. Copy explains the request, benefit and continued operation when declined. It does not directly trigger OS prompts without a consumer-supplied action.

`LocationOffState` presents two independent choices: Enable location or Choose city manually. No automatic retry or repeated permission pressure is implemented.

`StaleInformationState` distinguishes review-due/outdated, includes last-check information only when supplied and offers source/update actions where supported. Stale content remains visible unless a future safety policy explicitly blocks it.
