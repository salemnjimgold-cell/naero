# Dependency Security Triage

## Result

- Before: 27 advisories (15 high, 12 moderate, 0 critical).
- After compatible `npm audit fix`: 22 advisories (12 high, 10 moderate, 0 critical).
- Backend: 0 advisories.
- No `--force`, Expo/RN major change, or incompatible override was used.

## Matrix

| Class / affected tree | Directness | Exposure in Naero | Compatible fix | Disposition |
|---|---|---|---|---|
| `image-size` through Metro/RN/Expo | Transitive | Build/development asset processing; not a backend request path | No; audit proposes incompatible framework versions | Defer to framework-upgrade milestone |
| `postcss` through Expo Metro config | Transitive | Build tooling | No; audit proposes Expo 57 | Defer |
| `uuid` through `@expo/ngrok` and `xcode` | Transitive (`@expo/ngrok` is direct) | Development tunnel/iOS tooling; low Android production exposure | No supported current-tree fix | Defer |
| Expo CLI/config/prebuild/Metro packages | Mostly transitive | Development/build tooling | Audit proposes Expo 57 | Defer |
| Expo modules (`expo-asset`, auth session/linking/constants) | Direct or transitive | Some runtime use, but finding originates in shared toolchain dependencies | Only major Expo upgrade reported | Defer and retest during upgrade |
| React Native/community CLI/Reanimated tree | Direct and transitive | Runtime framework plus build tooling | Audit suggestions are incompatible with RN 0.81.5/Expo 54 | Defer; do not downgrade or force |

The remaining package count includes parent packages that npm reports because they depend on the vulnerable leaf packages; it is not 22 independent exploit classes. Practical exposure is reduced because the dominant unresolved paths execute during local bundling/building, but untrusted project assets and development endpoints should still be avoided.
