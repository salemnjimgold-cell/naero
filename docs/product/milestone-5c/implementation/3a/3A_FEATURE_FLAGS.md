# 3A Feature Flags

Flags:

| Flag | Default |
|---|---|
| `contextualCompass` | false |
| `newNavigation` | false |
| `newOnboarding` | false |
| `newDiscover` | false |
| `contextualHome` | false |
| `myNaero` | false |
| `settlementBasics` | false |
| `askNaeroV2` | false |

Configuration accepts booleans, `true/false`, or `1/0`. Invalid and unknown overrides are ignored. Production can receive non-secret static values through Expo `extra.featureFlags`; development may use `globalThis.__NAERO_FEATURE_FLAGS__`. There is no remote platform or secret material.

All flags are immutable after resolution and default off, preserving legacy behavior. A future slice must define flag dependencies and rollback before activating a surface.
