# Discover Specification

## Promise

**Understand and navigate what is around you.** Discover differs from Maps by organizing results around newcomer usefulness, authority and explanation—not only proximity/popularity.

## Structure

1. Context Header and universal search.
2. Intent shortcuts: Essentials, Healthcare, Transport, Public services, Groceries, Pharmacies, Language support, Community resources; Jobs/Housing only when real-data gates pass.
3. Verified/official city essentials.
4. Nearby practical places when device location is active.
5. City guides with jurisdiction/source labels.

## Search and results

- Search accepts plain-language needs and exact names; AI fallback is explicitly offered, never automatic.
- Results support List/Map toggle. List is default for accessibility and source comparison; map uses the same result set and filters.
- Filters: category, distance (location only), open now (only reliable hours), trust class, accessibility attributes when sourced, language support when sourced.
- Cards show name, kind, reason/relevance, distance when valid, current hours only when reliable, trust label and freshness/attribution summary.
- Result ordering separates official/verified relevance from sponsored/popularity concepts; no paid ranking is specified.

## Detail actions

Primary action is context-dependent: directions, official website, or call. Secondary actions: save, share, Source Sheet, Ask about this. All external actions identify their destination before leaving Naero.

## Data honesty

- Missing hours display “Hours not available,” never “Closed.”
- Manual-city results do not imply live proximity.
- Stale cached results display retrieval age.
- Provider and Naero verification are separate labels.
- Empty nearby results state that none were found within the selected radius and offer radius/category/city changes.

## States and modes

Guest access is full for public results; saving locally is allowed and sync upgrade is optional. Offline shows saved/cached results with age. Unsupported jurisdictions may expose external provider results but no reviewed city-essential claims. Loading uses result skeletons while retaining context/filter controls. Error preserves previous results where safe.

## Accessibility/RTL

Map never becomes the only result representation. Pins have list equivalents; filters expose selected states; map gestures are not required. Addresses use locale-aware mixed-direction containers. Route/directional icons mirror only when their meaning is relative to UI flow.
