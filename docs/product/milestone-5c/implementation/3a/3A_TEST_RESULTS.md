# 3A Test Results

## Foundation tests

- Semantic dark/light roles: PASS
- System/light/dark resolution and corrupt preference: PASS
- Legacy aliases: PASS
- Unknown-context truth behavior: PASS
- Austria/Vienna and France/Paris generic jurisdiction representation: PASS
- Canonical trust/freshness validation: PASS
- Feature-flag defaults/overrides/invalid values: PASS
- RTL directional helpers: PASS
- Typography, touch targets and reduced motion: PASS
- Additive provider and legacy route-presence smoke: PASS
- Contrast pairs: PASS (14/14)

## Regression

Direct execution passed: backend foundation, local AI, location foundation, gateway, mobile API client, nearby providers, PostGIS, four Milestone 5B security suites, and both 3A suites. Location and nearby TypeScript checks passed.

The dependency manifests/lockfiles are unchanged from Milestone 5B. The last completed audits remain root 22 (12 high, 10 moderate, 0 critical) and backend 0; a fresh audit command was attempted but exceeded the bounded environment/network window.

## Tooling warning

Expo lint, Expo Android export and an offline Metro start were attempted with bounded multi-minute windows. They remained active without producing a result and were terminated by exact command line after timeout. Earlier orphaned processes from these attempts were explicitly stopped. No diagnostic failure was emitted. The additive provider/legacy-route static smoke, targeted foundation tests and all executable baseline suites passed. A live runtime boot is therefore not claimed. This is classified as a local toolchain-duration warning.
