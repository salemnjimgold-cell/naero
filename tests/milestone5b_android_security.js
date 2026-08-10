const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const gradle = fs.readFileSync(path.join(root, 'android/app/build.gradle'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'android/app/src/main/AndroidManifest.xml'), 'utf8');

assert.strictEqual((gradle.match(/signingConfig\s+signingConfigs\.debug/g) || []).length, 1, 'Only the debug build type may use debug signing');
assert(gradle.includes('NAERO_RELEASE_STORE_FILE'));
assert(gradle.includes('NAERO_RELEASE_STORE_PASSWORD'));
assert(gradle.includes('NAERO_RELEASE_KEY_ALIAS'));
assert(gradle.includes('NAERO_RELEASE_KEY_PASSWORD'));
assert(gradle.includes('Naero release signing is not configured'));

for (const permission of [
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.SYSTEM_ALERT_WINDOW',
]) {
  const removal = new RegExp(`<uses-permission[^>]+android:name="${permission.replace(/\./g, '\\.') }"[^>]+tools:node="remove"`);
  assert(removal.test(manifest), `${permission} must be explicitly removed from merged manifests`);
}
for (const permission of [
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.INTERNET',
  'android.permission.VIBRATE',
]) {
  assert(manifest.includes(permission), `${permission} must remain`);
}
assert(manifest.includes('android:allowBackup="false"'));
assert(manifest.includes('android:dataExtractionRules="@xml/data_extraction_rules"'));
assert(manifest.includes('android:fullBackupContent="@xml/backup_rules"'));

console.log('Milestone 5B Android security configuration: passed');
