# JWT Migration Report: Supabase ECC P-256 Signing Keys

## Summary

Supabase now uses **ES256 (ECC P-256)** signing keys by default for new JWT tokens. This is a breaking change from the previous **HS256 (HMAC with SHA-256)** shared-secret approach. The Naero backend has been updated to support both verification methods.

## Problem

When a Supabase project is created (or existing one is updated), the JWT signing key is now an ES256 private key. Tokens signed with this key **cannot be verified** by the old `crypto.createHmac('sha256', secret)` approach — HMAC and ECDSA are fundamentally different cryptographic primitives.

Attempting to verify an ES256-signed token with the old shared secret produces a validation error, causing all authenticated API requests to fail.

## Solution Architecture

```
┌──────────────┐     Auth Header     ┌──────────────────────┐
│   Supabase   │ ─── Bearer JWT ──▶  │  Naero Backend       │
│  (Auth)      │                     │                      │
└──────────────┘                     │  1. decodeProtectedHeader  │
                                     │     ↓                    │
                                     │  ES256/RS*? ──yes──▶   │
                                     │    JWKS verify           │
                                     │     (jose)               │
                                     │     ↓                    │
                                     │  HS256? ──yes──▶       │
                                     │    HMAC verify (legacy)  │
                                     │     ↓                    │
                                     │ 401 Invalid Token        │
                                     └──────────────────────┘
                                  ┌──────────────────────┐
                                  │  JWKS Endpoint       │
                                  │  {SUPABASE_URL}/     │
                                  │  .well-known/jwks.json│
                                  └──────────────────────┘
```

## Changes Made

### 1. Dependencies
- **Added** `jose` library (v6.0.10) — purpose-built JWK/JWT library for Node.js
  - `createRemoteJWKSet()` — fetches and caches JWKS from Supabase JWKS endpoint
  - `jwtVerify()` — verifies JWT tokens against JWKS (supports ES256, ES384, ES512, RS256, RS384, RS512)
  - `decodeProtectedHeader()` — reads the JWT header to determine algorithm
- No other dependencies changed

### 2. `backend/src/config/env.js`
- **Removed** `SUPABASE_JWT_SECRET` from `REQUIRED_PRODUCTION_VARS`
- **Added** `supabase.jwksUrl` — auto-computed from `SUPABASE_URL` as `{SUPABASE_URL}/.well-known/jwks.json`
- **Updated** `getConfigStatus()` — reports `jwtVerificationMethod: 'jwks' | 'hs256' | 'none'`
- **Updated** `validateEnv()` — passes if JWKS URL is set (via SUPABASE_URL) OR legacy secret is set

### 3. `backend/src/middleware/auth.js`
- **Added** `verifyJwtWithJwks(token, jwksUrl)` — async JWKS verification using `jose.jwtVerify`
- **Added** `getJwksRemoteSet(jwksUrl)` — cached JWKS remote set (10 min cache, 30s cooldown)
- **Changed** `authenticateRequest()` — now `async`, tries JWKS first (for ES/RS tokens), falls back to HS256
- **Kept** `verifyHs256()` — unchanged for legacy compatibility
- **Added** algorithm detection via `decodeProtectedHeader` — only sends ES/RS tokens to JWKS

### 4. `backend/src/server.js`
- **Updated** all 6 `authenticateRequest()` calls to `await` the new async function

### 5. `backend/docs/DEPLOYMENT.md`
- **Moved** `SUPABASE_JWT_SECRET` from Required to Optional section
- **Added** JWT verification section explaining the two methods (JWKS primary, HS256 fallback)

### 6. `deploy/render/render.yaml`
- **Removed** `SUPABASE_JWT_SECRET` from env vars (JWKS URL is derived from `SUPABASE_URL`)

## Backward Compatibility

| Token algorithm | Old backend | New backend |
|----------------|-------------|-------------|
| HS256 (legacy) | ✅ Works | ✅ Works (if secret set) |
| ES256 (new) | ❌ Fails | ✅ Works (JWKS primary) |
| RS256 | ❌ Fails | ✅ Works (JWKS) |

- If `SUPABASE_JWT_SECRET` is **not** set and the token is HS256 → returns error (no legacy secret to verify with)
- If `SUPABASE_JWT_SECRET` **is** set and the token is HS256 → verified via HMAC (same as before)
- If JWKS URL is set and token is ES256/RS* → verified via JWKS

## Testing

```
node backend/scripts/smoke.js        → passed
node tests/qa_backend_foundation.js    → passed
```

- All 53 existing backend tool calling tests pass
- Code paths added but not tested in CI: JWKS fetch (requires live Supabase URL)
