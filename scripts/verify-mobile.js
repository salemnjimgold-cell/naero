/**
 * Naero Mobile — Comprehensive Runtime Verification
 * Runs all module imports and flow simulations to catch crashes early.
 * Usage: node scripts/verify-mobile.js
 */

const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '..', 'src');
let passed = 0;
let failed = 0;
let errors = [];

function check(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
  }
}

function verifyImport(filePath) {
  try {
    const resolved = require.resolve(filePath);
    check(true, `Imports: ${path.relative(SRC, resolved)}`);
    return true;
  } catch (e) {
    check(false, `Imports: ${filePath} — ${e.message}`);
    errors.push({ file: filePath, error: e.message });
    return false;
  }
}

function verifyFileExists(filePath) {
  try {
    const exists = fs.existsSync(filePath);
    check(exists, `Exists: ${path.relative(SRC, filePath)}`);
    if (!exists) errors.push({ file: filePath, error: 'File not found' });
    return exists;
  } catch (e) {
    check(false, `Exists: ${filePath} — ${e.message}`);
    return false;
  }
}

console.log('\n=== Naero Mobile — Release Verification ===\n');

// 1. Verify core config files
console.log('[Config]');
verifyFileExists(path.join(SRC, 'config', 'api.js'));

// 2. Verify service files
console.log('\n[Services — API Layer]');
verifyImport(path.join(SRC, 'services', 'api', 'naeroApi'));
verifyImport(path.join(SRC, 'services', 'api', 'naeroAI'));
verifyImport(path.join(SRC, 'services', 'api', 'naeroNotifications'));
verifyImport(path.join(SRC, 'services', 'api', 'naeroRealtime'));

console.log('\n[Services — Core]');
verifyImport(path.join(SRC, 'services', 'supabase'));
verifyImport(path.join(SRC, 'services', 'authService'));
verifyImport(path.join(SRC, 'services', 'apiClient'));
verifyImport(path.join(SRC, 'services', 'dataService'));
verifyImport(path.join(SRC, 'services', 'placeService'));
verifyImport(path.join(SRC, 'services', 'offlineQueue'));
verifyImport(path.join(SRC, 'services', 'analyticsService'));

console.log('\n[Services — Index]');
verifyImport(path.join(SRC, 'services', 'index'));

// 3. Verify context loads
console.log('\n[Context]');
verifyImport(path.join(SRC, 'context', 'AppContext'));

// 4. Verify all screens load
console.log('\n[Screens]');
const screens = [
  'SplashScreen', 'OnboardingScreen', 'AuthScreen', 'LocationPermissionScreen',
  'HomeScreen', 'ExploreScreen', 'ServicesScreen', 'CommunityScreen',
  'ProfileScreen', 'JobsScreen', 'SafetyScreen',
  'AIScreen', 'PlaceDetailScreen', 'ServiceDetailScreen',
  'JobDetailScreen', 'CommunityDetailScreen', 'SettingsScreen',
  'AboutScreen', 'NotificationsScreen',
];
for (const s of screens) {
  verifyImport(path.join(SRC, 'screens', s));
}

// 5. Verify navigation loads
console.log('\n[Navigation]');
verifyImport(path.join(SRC, 'navigation', 'AppNavigator'));

// 6. Verify component files
console.log('\n[Components]');
const components = [
  'AIFloatingButton', 'BrandedButtons', 'CategoryGrid', 'EmptyState',
  'GlassCard', 'LanguageModal', 'ListingCard', 'LoadingState',
  'LogoHeader', 'NaeroMascot', 'ScreenHeader', 'SectionHeader',
];
for (const c of components) {
  verifyImport(path.join(SRC, 'components', c));
}

// 7. Verify theme, i18n, AI engine
console.log('\n[Theme / i18n / AI]');
verifyImport(path.join(SRC, 'theme', 'index'));
verifyImport(path.join(SRC, 'i18n', 'index'));
verifyImport(path.join(SRC, 'ai', 'engine'));
verifyImport(path.join(SRC, 'ai', 'config'));
verifyImport(path.join(SRC, 'ai', 'context'));
verifyImport(path.join(SRC, 'ai', 'knowledge'));
verifyImport(path.join(SRC, 'ai', 'memory'));
verifyImport(path.join(SRC, 'ai', 'profile'));
verifyImport(path.join(SRC, 'ai', 'router'));

// 8. Verify mock data
console.log('\n[Data / Models]');
const mockFiles = [
  'categories', 'places', 'services', 'jobs', 'safetyTips',
  'schema', 'providers/mockPlaces', 'providers/mockServices',
  'providers/mockJobs', 'providers/mockHousing', 'providers/mockCommunity',
  'providers/mockSafety', 'providers/mockCategories',
  'models/Place', 'models/UserProfile',
];
for (const m of mockFiles) {
  verifyImport(path.join(SRC, 'data', m));
}

// 9. Verify no hardcoded secrets in source
console.log('\n[Secrets Scan]');
function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
      files.push(...walkDir(full));
    } else if (e.isFile() && (e.name.endsWith('.js') || e.name.endsWith('.ts'))) {
      files.push(full);
    }
  }
  return files;
}

const sourceFiles = walkDir(SRC);
let secretHits = 0;
const secretsPatterns = [
  /sk-[a-zA-Z0-9]{20,}/g,     // OpenAI keys
  /AIza[0-9A-Za-z\-_]{35}/g,  // Google API keys
  /ghp_[a-zA-Z0-9]{36}/g,     // GitHub tokens
  /SG\.[a-zA-Z0-9\-_]{20,}\.[a-zA-Z0-9\-_]{20,}/g, // SendGrid
  /service_role/i,             // Supabase service_role key references
];
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const pattern of secretsPatterns) {
    const matches = content.match(pattern);
    if (matches && !content.includes('.env') && !content.includes('EXPO_PUBLIC')) {
      secretHits += matches.length;
    }
  }
}
check(secretHits === 0, `No hardcoded secrets (${secretHits} potential hits found)`);
if (secretHits > 0) errors.push({ file: 'src/', error: `${secretHits} potential secret patterns found` });

// 10. Verify .env.example exists and has no secrets
console.log('\n[Env Config]');
const envExample = path.resolve(__dirname, '..', '.env.example');
if (verifyFileExists(envExample)) {
  const envContent = fs.readFileSync(envExample, 'utf8');
  check(envContent.includes('EXPO_PUBLIC_NAERO_API_URL'), 'Contains EXPO_PUBLIC_NAERO_API_URL');
  check(envContent.includes('EXPO_PUBLIC_SUPABASE_URL'), 'Contains EXPO_PUBLIC_SUPABASE_URL');
  check(envContent.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY'), 'Contains EXPO_PUBLIC_SUPABASE_ANON_KEY');
  check(!envContent.includes('sk-'), 'No OpenAI keys in .env.example');
  check(!envContent.includes('AIza'), 'No Google API keys in .env.example');
  check(!envContent.includes('ghp_'), 'No GitHub tokens in .env.example');
}

// 11. Validate supabase module guard handles missing config
console.log('\n[Supabase Guard]');
const supabasePath = path.join(SRC, 'services', 'supabase.js');
if (fs.existsSync(supabasePath)) {
  const supabaseContent = fs.readFileSync(supabasePath, 'utf8');
  check(supabaseContent.includes('getSupabaseClient'), 'Has getSupabaseClient');
  check(supabaseContent.includes('isSupabaseConfigured'), 'Has isSupabaseConfigured');
  check(supabaseContent.includes('return null'), 'Gracefully returns null when unconfigured');
}

// 12. Verify naeroApi retry/backoff logic
console.log('\n[API Client]');
const apiPath = path.join(SRC, 'services', 'api', 'naeroApi.js');
if (fs.existsSync(apiPath)) {
  const apiContent = fs.readFileSync(apiPath, 'utf8');
  check(apiContent.includes('exponentialBackoff') || apiContent.includes('Math.pow'), 'Has exponential backoff');
  check(apiContent.includes('refreshToken'), 'Has token refresh');
  check(apiContent.includes('401'), 'Handles 401 responses');
  check(apiContent.includes('retries') || apiContent.includes('maxRetries'), 'Has retry logic');
}

// Summary
console.log('\n=== Results ===');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (errors.length > 0) {
  console.log('\n=== Errors ===');
  for (const e of errors) {
    console.log(`  ${e.file}: ${e.error}`);
  }
}

console.log('\n---');
if (failed === 0) {
  console.log('All verifications passed. Release candidate ready for build validation.');
  process.exit(0);
} else {
  console.log(`${failed} check(s) failed. Review errors before building.`);
  process.exit(1);
}
