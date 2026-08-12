# Naero Android APK Build Report

## Build Summary

| Field | Value |
|-------|-------|
| **Status** | ✅ **SUCCESS** |
| **APK File** | `Naero-v1.1.3-release.apk` (project root) |
| **APK Source** | `android/app/build/outputs/apk/release/app-release.apk` |
| **APK Size** | 80.79 MB |
| **Package Name** | `com.naero.app` |
| **Version Name** | `1.1.3` |
| **Version Code** | `6` |
| **minSdkVersion** | `24` |
| **targetSdkVersion** | `36` |
| **compileSdkVersion** | `36` |
| **Build Type** | `release` |
| **Signing** | Debug keystore (`android/app/debug.keystore`) |
| **Signature Verification** | ✅ Verified OK (`apksigner verify` passes) |
| **JS Engine** | Hermes (enabled) |
| **New Architecture** | Enabled (Fabric renderer) |

## Environment

| Component | Version |
|-----------|---------|
| Java | OpenJDK 17.0.19 (Temurin) |
| Android SDK | API 36 |
| Build Tools | 37.0.0 |
| Gradle | Expo-managed (wrapper) |
| React Native | 0.81.5 (SDK 54) |

## Environment Variables

| Variable | Status | Notes |
|----------|--------|-------|
| `EXPO_PUBLIC_NAERO_API_URL` | ✅ Set | `http://localhost:3000` (placeholder) |
| `EXPO_PUBLIC_SUPABASE_URL` | ⚠️ Placeholder | Update for production use |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ⚠️ Placeholder | Update for production use |
| `NAERO_RELEASE_STORE_FILE` | ❌ Not set | Falling back to debug keystore |
| `NAERO_RELEASE_STORE_PASSWORD` | ❌ Not set | Falling back to debug keystore |
| `NAERO_RELEASE_KEY_ALIAS` | ❌ Not set | Falling back to debug keystore |
| `NAERO_RELEASE_KEY_PASSWORD` | ❌ Not set | Falling back to debug keystore |

## Permissions Declared

- `android.permission.INTERNET`
- `android.permission.ACCESS_FINE_LOCATION`
- `android.permission.ACCESS_COARSE_LOCATION`
- `android.permission.WRITE_EXTERNAL_STORAGE`
- `android.permission.READ_EXTERNAL_STORAGE`

## APK Contents (Key Paths)

- `classes.dex` (multiple) — DEX bytecode
- `lib/armeabi-v7a/`, `lib/arm64-v8a/`, `lib/x86/`, `lib/x86_64/` — Native libraries
- `assets/index.android.bundle` — Hermes-compiled JS bundle
- `res/` — All localized resources
- `AndroidManifest.xml` — Binary manifest
- `META-INF/` — Signing certificates and manifest

## Notes

- The APK is **signed with the debug keystore** because no production release signing config was provided (`NAERO_RELEASE_STORE_FILE` etc. are unset). This is suitable for development, testing, and internal distribution.
- For **Play Store release**, a production keystore must be generated and configured via the above `NAERO_RELEASE_*` environment variables or `gradle.properties`.
- The `EXPO_PUBLIC_*` env vars contain placeholder values. The app will run in guest/limited mode. Replace with real Supabase project credentials and a deployed backend URL for full functionality.
- No backend or frontend source code was modified during this build.
