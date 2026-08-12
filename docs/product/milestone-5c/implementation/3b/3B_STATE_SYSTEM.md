# 3B UI State System

Implemented primitives:

- `InlineLoading`, `Skeleton`, `CardSkeleton`, `SectionSkeleton`
- `EmptyState`
- `ErrorState`
- `OfflineState`
- `PermissionState`
- `LocationOffState`
- `StaleInformationState`
- `UnsupportedJurisdictionState`
- Shared `StateView`

Skeletons preserve layout and use static low-contrast surfaces; no perpetual shimmer dependency was added. A section exposes one localized progress semantic while decorative skeleton shapes are hidden from assistive technology.

Empty states explain what is empty and what action is available. Errors distinguish network, service, invalid data, unavailable content, permission and unknown failures. Retry appears only for retryable classes. Raw backend errors/stacks are never rendered; an optional safe reference ID may be shown.

Unsupported jurisdiction explicitly says governed guidance is unavailable while nearby/general utility may remain available. It never labels the whole location or application unsupported.
