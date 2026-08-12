# Milestone 5A Baseline Verification Results

Verification run on 2026-08-10 using the existing dependency installation. No dependency versions were changed.

| Check | Command | Result | Baseline blocker? | Notes |
|---|---|---|---|---|
| Expo lint | `npm run lint` | PASS with warnings | No | 0 errors, 73 pre-existing warnings |
| Location type check | `npm run typecheck:location` | PASS | No | Scoped static check |
| Nearby type check | `npm run typecheck:nearby` | PASS | No | Scoped static check |
| Backend foundation | `npm run test:backend` | PASS | No | Health/config/auth boundary |
| Local AI | `npm run test:ai` | PASS 11/11 | No | Deterministic local engine only |
| Location foundation | `npm run test:location` | PASS 7/7 | No | Pure location behavior |
| Gateway and mobile client | `npm run test:gateway` | PASS 16/16 + 3/3 | No | Includes validation, errors, CORS, rate limits |
| Nearby providers | `npm run test:nearby` | PASS 40/40 | No | Providers, ranking, fallback and mobile wiring |
| Live city provider | `npm run test:nearby:cities` | PASS 7/7 | No | Network-dependent Overpass test; transient provider failures remain possible |
| PostGIS source/policy | `npm run test:postgis` | PASS 36/36 | No | Static and simulated RLS/RPC/provider behavior; not production deployment |
| Root dependency audit | `npm audit --omit=dev` | FAIL | No for preservation | 27 known advisories: 15 high, 12 moderate; deferred to 5B |
| Backend dependency audit | `npm audit --omit=dev --prefix backend` | PASS | No | 0 known vulnerabilities |
| Android source/config | File/config and APK metadata inspection | PASS with warning | No | Required Kotlin files present; version 1.2.0/API min 24; release uses debug signing |

## Failure separation

- Code regressions found by current functional suites: none.
- Environmental failures: none in this run.
- Network/provider failures: none in this run; the same live-city suite previously observed a transient Overpass HTTP 504.
- Pre-existing warnings: 73 lint warnings, root dependency advisories, and debug release signing.

