# 3C Navigation Architecture

`newNavigation=false` keeps the legacy `Home | World | People` navigator unchanged. `newNavigation=true` selects a separate `Home | Discover | Plan | My Naero` tab navigator. Existing detail routes remain in the shared stack.

Ask Naero is a safe-area-aware, logical-end floating action that opens the existing `AI` stack route; it is not a tab. Community remains reachable from My Naero and its existing screen/detail routes are retained. No legacy screen was deleted.
