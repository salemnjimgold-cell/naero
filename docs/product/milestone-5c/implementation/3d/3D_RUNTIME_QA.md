# 3D Runtime QA

Device: Xiaomi 25062RN2DA, Android 16, arm64 debug APK, ADB reverse, Metro 8081.

Verdict: PASS WITH WARNINGS.

- `newDiscover=true`: migrated list-first surface rendered.
- Permission-derived Győr/Hungary: Current location label rendered; real-distance policy enabled in the normalized contract.
- Manual Vienna/Austria: Selected city rendered; no distance was shown.
- Arabic Vienna: complete migrated surface rendered RTL with translated context, search, groups, categories, states, and tab labels.
- Light and dark: semantic surfaces, selected chips, fields, and error state rendered in both modes. Device mode was restored after the dark test.
- Context change: reused 3C location/manual-city flow.
- `newDiscover=false`: legacy Discover rendered unchanged.
- No fatal native, React TypeError, or ReferenceError was observed.

Provider warning: the configured `https://naero.onrender.com/api/v1/nearby` endpoint returned HTTP 404. The existing live-city QA also returned Overpass HTTP 504 twice. Consequently, real cards, detail, SourceSheet, and external actions could not be visually exercised without fabricating data. The UI showed the honest translated error state. A separate pre-existing Supabase network warning appeared once in the debug LogBox during authentication initialization.

The inherited status-bar warning remains: the app-wide forced light icon style is readable in dark mode but low contrast over semantic light screens. A route-aware shared fix attempted during 3C did not take effect on Android 16; changing it globally would regress legacy dark screens, so 3D does not broaden that change.
