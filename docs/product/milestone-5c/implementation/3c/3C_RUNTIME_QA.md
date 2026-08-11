# 3C Runtime QA

Device target: Xiaomi 25062RN2DA, Android 16, arm64 debug APK, ADB reverse, Metro port 8081.

Final result: PASS WITH WARNINGS.

- Flags off preserved legacy authentication, guest entry, and `Home | World | People` navigation.
- Flags on completed Arabic guest/manual setup for Austria → Vienna Land → Vienna; RTL alignment, back direction, row order, native copy, and immediate language switching rendered correctly.
- The foreground permission dialog was left to the owner. The owner explicitly selected “While using the app”; Naero then displayed the OS-derived Győr, Hungary context with `permission_derived` provenance.
- Restart persistence skipped onboarding and restored the same permission-derived context.
- `Home | Discover | Plan | My Naero` all opened. Home exposed only persisted context; Plan stated no plan and no Settlement Basics; My Naero showed context/language/Guest plus Profile and Community bridges.
- Ask Naero opened the existing AI stack route as a floating action and back returned to the shell; it never became a fifth tab.
- No fatal Android, React Native type/reference, or uncaught runtime errors appeared.

Warnings: Discover is intentionally the existing deferred bridge and its unavailable route state remains honest. Debug builds show existing development warnings, including a transient warning banner; these are absent from the production export. The pre-existing global light status-bar style remains low contrast over the semantic light Plan canvas and should be corrected in a cross-app theme pass.
