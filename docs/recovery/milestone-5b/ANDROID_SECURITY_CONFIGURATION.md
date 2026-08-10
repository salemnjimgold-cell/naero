# Android Security Configuration

## Release signing

Debug builds retain the standard debug signing configuration. Release builds never fall back to it. Supply all four values as Gradle properties or environment variables:

- `NAERO_RELEASE_STORE_FILE`
- `NAERO_RELEASE_STORE_PASSWORD`
- `NAERO_RELEASE_KEY_ALIAS`
- `NAERO_RELEASE_KEY_PASSWORD`

Do not place values in tracked files. With credentials absent, a release packaging/bundle/assemble request terminates with an explicit configuration error. No production keystore was generated or committed.

## Permissions

The generated release merged manifest contains coarse/fine location, internet, vibrate, biometric/fingerprint support required by SecureStore, and Android's app-scoped dynamic-receiver permission. It does not contain external-storage, overlay, advertising ID/ad-services, install-referrer, background-location, nearby-device, or notification permissions.

`processReleaseMainManifest` completed successfully. Location and network permissions support existing foreground location/network functionality; biometric declarations are introduced by secure local storage.

## Backup

The application sets `android:allowBackup="false"`. `backup_rules.xml` and `data_extraction_rules.xml` also exclude files, databases, shared preferences, root storage, and external storage from legacy backup, cloud backup, and device transfer. This defense in depth prevents authentication/session/location persistence from entering Android backup channels.
