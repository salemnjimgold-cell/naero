# Navigation Architecture

## Root tree

```text
Root
├─ Launch
│  ├─ Splash
│  ├─ Welcome
│  ├─ Language
│  ├─ GuestOrAccount
│  ├─ Authentication
│  ├─ LocationChoice
│  ├─ CityConfirmation
│  └─ IntentSelection (optional/skippable)
├─ MainTabs
│  ├─ HomeStack
│  │  ├─ Home
│  │  ├─ HelpNow
│  │  ├─ SafetyDetail
│  │  └─ ContinueTarget
│  ├─ DiscoverStack
│  │  ├─ Discover
│  │  ├─ Search
│  │  ├─ CategoryResults
│  │  ├─ MapResults
│  │  ├─ PlaceDetail
│  │  ├─ ServiceDetail
│  │  └─ GuidanceDetail
│  ├─ PlanStack
│  │  ├─ Plan
│  │  ├─ SettlementBasicsSetup
│  │  ├─ SettlementBasics
│  │  └─ PlanItemDetail
│  └─ MyNaeroStack
│     ├─ MyNaero
│     ├─ Saved
│     ├─ RecentActivity
│     ├─ Notifications
│     ├─ Settings
│     ├─ PrivacyAndData
│     ├─ Accessibility
│     ├─ AccountSecurity
│     ├─ Support
│     └─ About
├─ GlobalSearch
├─ AskNaero
│  ├─ CompactSheet
│  ├─ FullConversation
│  └─ ContextualExplanation
└─ GlobalSheets
   ├─ ContextPicker
   ├─ LanguagePicker
   ├─ LocationRationale
   ├─ SourceSheet
   ├─ TrustClassHelp
   ├─ SaveToCollection
   ├─ ReportInformation
   └─ GuestUpgrade
```

## Relationships

- Each tab owns its stack and preserves its last position.
- Search is globally reachable but returns users to the originating stack.
- Ask Naero opens as a compact sheet for a scoped question and promotes to full conversation without losing context.
- Source Sheet is modal and can open from any content or AI answer.
- Auth upgrade is contextual; successful auth returns to the initiating action.
- Safety bypasses AI and never depends on authentication or location.

## Current screen disposition

| Current screen | Decision | Future destination/reason |
|---|---|---|
| Splash | Redesign | Short accessible launch state |
| Welcome | Redesign | Product promise and guest-first entry |
| Onboarding | Retire/merge | Split into Language, context and optional intent steps |
| Auth | Redesign | Account-specific route after GuestOrAccount |
| LocationPermission | Redesign | LocationChoice plus rationale/manual city |
| Home | Replace | Real Contextual Compass hierarchy |
| Discover | Redesign | Discover root |
| Explore | Merge | Search/category behavior into Discover |
| Services | Merge | Discover category/results |
| Jobs | Move | Discover domain; production prominence gated by real data |
| Safety | Redesign/move | HelpNow and SafetyDetail |
| AI | Redesign | Ask Naero full conversation/contextual forms |
| Community | Move/defer | Future bounded community module; not primary nav now |
| CommunityDetail | Move/defer | Future topic/answer detail |
| PlaceDetail | Redesign | Unified place/service detail family |
| ServiceDetail | Redesign/merge | Unified detail family with distinct semantics |
| JobDetail | Move/redesign | Discover domain when real data exists |
| Profile | Replace | My Naero |
| Settings | Move/redesign | My Naero stack |
| Notifications | Move/evolve | My Naero stack |
| About | Move/evolve | Support/About |

Back behavior, deep links and analytics use stable semantic route IDs rather than localized labels.
