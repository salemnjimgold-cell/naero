# Component Architecture

## Navigation

- `AppHeader`: title, back/close, optional context-safe action; never overloaded.
- `BottomNavigation`: four labeled destinations, badges only for actionable counts.
- `ContextHeader`: selected jurisdiction and location mode; opens Context Picker.
- `SearchHeader`: query, clear, voice only if supported, filter and context.

## Actions

- `PrimaryButton`, `SecondaryButton`, `TertiaryButton`: text-first actions with loading/disabled/destructive variants.
- `IconAction`: icon plus accessible label/tooltip; icon-only only when universally understood.
- `AskNaeroAction`: persistent, contextual and inline variants; always exposes scope.
- `ExternalAction`: identifies call, directions, official/provider website and app transition.

## Trust and information

- `TrustBadge`: class icon+label; compact/full variants.
- `FreshnessLabel`: current/review due/outdated/unknown with date.
- `SourceSummary`: publisher, jurisdiction, freshness; opens Source Sheet.
- `SourceSheet`: full provenance and report action.
- `JurisdictionLabel`: country/subdivision/municipality hierarchy.
- `ReasonLabel`: why an item is suggested.

## Content

- `PlaceCard`: practical place with distance/hours only when reliable.
- `ServiceCard`: provider/authority service with trust and jurisdiction.
- `GuidanceCard`: reviewed explanatory content and one action.
- `PlanCard`: user-started plan/item status and source.
- `ContinueCard`: exactly one legitimate resumable action.
- `NearbyCard`: compact real nearby result.
- `SavedCard`: saved origin, age and availability.
- `SafetyCard`: verified urgent information; danger treatment only when appropriate.

## Inputs and selection

- `SearchField`, `ChoiceCard`, `FilterChip`, `SegmentedControl`, `ContextPicker`, `LanguagePicker`, `CityPicker`, `PlanGoalSelector`.
- Every selection exposes selected/disabled/error states without color reliance.

## States

- `Skeleton`: content-shaped and reduced-motion safe.
- `LoadingState`: named operation and cancel when possible.
- `EmptyState`: reason plus one recovery/setup action.
- `ErrorState`: classification, preserved data and recovery.
- `OfflineState`: scope and freshness.
- `PermissionState`: purpose, settings route and alternative.
- `LocationOffState`: manual city and non-location utility.
- `StaleState`, `UnsupportedJurisdictionState`.

## AI

- `AIComposer`: scoped input, send/cancel, keyboard-safe.
- `AIContext`: visible inherited context with edit/exclude controls.
- `AIAnswer`: accessible answer regions with explicit AI label.
- `AIUncertainty`: assumptions, unknowns and verify action.
- `AIAction`: structured supported action; never executes sensitive work silently.
- `AICompactSheet` and `AIConversation` compose the primitives.

## Reuse disposition

Current Text/Button/Card/Input/IconButton/ScreenLayout and state components evolve behind compatibility adapters. ActionButton/BrandedButtons/SocialAuthButton consolidate into action variants. ListingCard becomes typed content cards. AIFloatingButton is replaced by AskNaeroAction. CategoryGrid evolves into intent/category collections. NaeroMascot is retired from general empty states; a restrained compass state mark may replace it.
