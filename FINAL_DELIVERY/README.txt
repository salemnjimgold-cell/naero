===========================================================
  Naero v1.1.0 - Final APK Delivery
  Real-Time Data Platform
===========================================================

APK File:     Naero-final.apk
Version:      1.1.0 (versionCode 3)
Package Name: com.naero.app
Min SDK:      24 (Android 7.0 Nougat)
Target SDK:   36 (Android 16)
Size:         ~84 MB
Built:        June 21, 2026

HOW TO INSTALL ON ANDROID
-------------------------
1. Transfer Naero-final.apk to your Android device
   (via USB, email, cloud storage, or file manager).

2. On the device, open the APK file using a file manager.

3. If prompted, enable "Install from unknown sources" or
   "Install from this source" in Settings > Security.

4. Tap Install and wait for completion.

5. Open Naero from the app drawer.

IF ANDROID BLOCKS INSTALLATION
-------------------------------
- Go to Settings > Security > Install unknown apps (or
  "Install from unknown sources").
- Enable permission for your file manager or browser app.
- If you see "App not installed" or "Installation failed":
    * Check that the APK is not corrupted (compare file size).
    * Ensure your device runs Android 7.0 (API 24) or newer.
    * On Xiaomi/MIUI devices, enable "Install via USB" and
      "MIUI Optimization" may need to be disabled in
      Developer options.
    * Try installing via ADB: adb install Naero-final.apk
- This APK is signed with APK Signature Scheme v2+v3.
  Some older devices may require v1 (JAR) signing; if your
  device rejects the APK, install via ADB or use a device
  running Android 8.0+.

KNOWN LIMITATIONS
-----------------
- No physical device was connected during this build session
  for installation testing. The APK has been verified using
  apksigner, zipalign, and aapt tools.
- Google Places API integration requires an API key to be
  configured at runtime via configureGooglePlaces(API_KEY).
- Gemini AI API returns HTTP 429 (quota exhausted) as of
  build date; data-aware fallback uses local engine.
- Real-time Overpass API queries require internet connectivity
  and GPS location permission.

VERIFICATION SUMMARY
--------------------
  apksigner verify:  Verifies (v2+v3 schemes)
  zipalign -c:       Verification successful (4-byte aligned)
  Package name:      com.naero.app
  Version:           1.1.0 (code 3)
  Min/Target SDK:    24 / 36
  Permissions:       INTERNET, ACCESS_FINE_LOCATION,
                     ACCESS_COARSE_LOCATION

For questions or issues, please contact the development team.
===========================================================
