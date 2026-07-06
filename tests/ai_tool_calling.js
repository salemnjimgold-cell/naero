const { createToolExecutor } = require('../backend/src/services/ai/tools/executor');
const { createToolRegistry } = require('../backend/src/services/ai/tools/registry');
const { checkToolPermission, PERMISSIONS } = require('../backend/src/services/ai/tools/permissions');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.log(`  ✗ ${message}`);
  }
}

function assertEqual(a, b, message) {
  if (a === b) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.log(`  ✗ ${message} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
  }
}

// ── Mocks ──
const mockRepositories = {
  places: {
    list: async () => ({ data: [{ id: '1', name: 'Test Place' }], error: null }),
    getById: async (id) => ({ data: id === 'valid-id' ? [{ id: 'valid-id', name: 'Test Place' }] : [], error: null }),
    search: async () => ({ data: [{ id: '2', name: 'Found Place' }], error: null }),
    listByCityAndCategory: async () => ({ data: [{ id: '3', name: 'City Place' }], error: null }),
  },
  savedPlaces: {
    listByUser: async () => ({ data: [{ id: 's1', place_id: 'p1' }], error: null }),
    create: async (data, userId) => ({ data: [{ ...data, id: 'new-saved', user_id: userId }], error: null }),
  },
  reviews: {
    create: async (data, userId) => ({ data: [{ ...data, id: 'new-review', user_id: userId }], error: null }),
  },
  reports: {
    create: async (data, userId) => ({ data: [{ ...data, id: 'new-report', reporter_id: userId }], error: null }),
  },
  notifications: {
    listByUser: async () => ({ data: [{ id: 'n1', type: 'test' }], error: null }),
    create: async (data) => ({ data: [{ ...data, id: 'new-notif' }], error: null }),
  },
  activityLogs: {
    create: async (entry) => {
      mockRepositories.activityLogs._lastAuditLog = entry;
      return { data: [entry], error: null };
    },
    _lastAuditLog: null,
    ACTIVITY_TYPES: { TOOL_EXECUTION: 'tool_execution' },
  },
};

const mockProfileStore = {
  getProfile: async (userId) => ({ data: userId === 'user-1' ? [{ id: 'user-1', display_name: 'Test User' }] : [], error: null }),
  upsertProfile: async (userId, data) => ({ data: [{ id: userId, ...data }], error: null }),
};

const mockEnv = { ai: { provider: 'openai' } };

async function runTests() {
  console.log('=== AI Tool Calling Tests ===\n');

  // ── Tool Registry Tests ──
  console.log('1. Tool Registry');

  const registry = createToolRegistry(mockRepositories, mockProfileStore);
  const allTools = registry.getAllTools();
  const toolCount = Object.keys(allTools).length;

  assertEqual(toolCount, 10, 'Registry contains all 10 tools');
  assert(allTools.searchPlaces !== undefined, 'searchPlaces tool registered');
  assert(allTools.getPlaceDetails !== undefined, 'getPlaceDetails tool registered');
  assert(allTools.getSavedPlaces !== undefined, 'getSavedPlaces tool registered');
  assert(allTools.savePlace !== undefined, 'savePlace tool registered');
  assert(allTools.createReview !== undefined, 'createReview tool registered');
  assert(allTools.createReport !== undefined, 'createReport tool registered');
  assert(allTools.getNotifications !== undefined, 'getNotifications tool registered');
  assert(allTools.createNotification !== undefined, 'createNotification tool registered');
  assert(allTools.getUserProfile !== undefined, 'getUserProfile tool registered');
  assert(allTools.updateUserPreferences !== undefined, 'updateUserPreferences tool registered');

  const defs = registry.getToolDefinitions();
  assertEqual(defs.length, 10, 'Tool definitions generated for all 10 tools');
  assert(defs[0].type === 'function', 'Tool definition uses function type');
  assert(defs[0].function.name !== undefined, 'Tool definition has function name');
  assert(defs[0].function.parameters !== undefined, 'Tool definition has parameters');

  // ── Permission Tests ──
  console.log('\n2. Permission Checks');

  const permResult1 = checkToolPermission(PERMISSIONS.READ_PLACES, null);
  assert(permResult1.allowed === true, 'read:places allowed without auth');

  const permResult2 = checkToolPermission(PERMISSIONS.READ_SAVED, null);
  assert(permResult2.allowed === false, 'read:saved_places denied without auth');

  const permResult3 = checkToolPermission(PERMISSIONS.READ_SAVED, 'user-1');
  assert(permResult3.allowed === true, 'read:saved_places allowed with auth');

  const permResult4 = checkToolPermission(PERMISSIONS.WRITE_REVIEWS, 'user-1');
  assert(permResult4.allowed === true, 'write:reviews allowed with auth');

  // ── Tool Executor Tests ──
  console.log('\n3. Tool Executor — Allowed Calls');

  const executor = createToolExecutor(mockEnv, mockRepositories, mockProfileStore);

  const result1 = await executor.execute('searchPlaces', { city: 'Budapest', limit: 10 }, 'user-1');
  assert(result1.success === true, 'searchPlaces succeeds with valid args');
  assert(result1.tool === 'searchPlaces', 'searchPlaces returns correct tool name');
  assert(result1.executionMs >= 0, 'searchPlaces reports execution time');
  assert(result1.error === null, 'searchPlaces has no error');

  const result2 = await executor.execute('getPlaceDetails', { placeId: 'valid-id' }, 'user-1');
  assert(result2.success === true, 'getPlaceDetails succeeds with valid placeId');

  const result3 = await executor.execute('getSavedPlaces', {}, 'user-1');
  assert(result3.success === true, 'getSavedPlaces succeeds with auth');

  const result4 = await executor.execute('savePlace', { placeId: 'p1', listName: 'favorites' }, 'user-1');
  assert(result4.success === true, 'savePlace succeeds with valid args');

  const result5 = await executor.execute('createReview', { placeId: 'p1', rating: 4, content: 'Great place!' }, 'user-1');
  assert(result5.success === true, 'createReview succeeds with valid args');

  // ── Tool Executor — Invalid Arguments ──
  console.log('\n4. Tool Executor — Invalid Arguments');

  const result6 = await executor.execute('getPlaceDetails', {}, 'user-1');
  assert(result6.success === false, 'getPlaceDetails fails without placeId');
  assertEqual(result6.error?.code, 'MISSING_ARGUMENT', 'getPlaceDetails returns MISSING_ARGUMENT');

  const result7 = await executor.execute('createReview', { placeId: 'p1', rating: 6, content: 'Bad' }, 'user-1');
  assert(result7.success === false, 'createReview fails with invalid rating');
  assertEqual(result7.error?.code, 'INVALID_ARGUMENT', 'createReview returns INVALID_ARGUMENT');

  const result8 = await executor.execute('createReview', { placeId: 'p1', content: 'No rating' }, 'user-1');
  assert(result8.success === false, 'createReview fails without rating');

  const result9 = await executor.execute('createReport', {}, 'user-1');
  assert(result9.success === false, 'createReport fails with missing args');
  assertEqual(result9.error?.code, 'MISSING_ARGUMENT', 'createReport returns MISSING_ARGUMENT');

  const result10 = await executor.execute('createReport', { reportableType: 'invalid', reportableId: '1', reason: 'test' }, 'user-1');
  assert(result10.success === false, 'createReport fails with invalid type');
  assertEqual(result10.error?.code, 'INVALID_ARGUMENT', 'createReport returns INVALID_ARGUMENT');

  // ── Tool Executor — Unauthorized Calls ──
  console.log('\n5. Tool Executor — Unauthorized Calls');

  const result11 = await executor.execute('getSavedPlaces', {}, null);
  assert(result11.success === false, 'getSavedPlaces fails without auth');

  const result12 = await executor.execute('savePlace', { placeId: 'p1' }, null);
  assert(result12.success === false, 'savePlace fails without auth');

  const result13 = await executor.execute('getPlaceDetails', { placeId: 'valid-id' }, null);
  assert(result13.success === true, 'getPlaceDetails succeeds without auth (public read)');

  // ── Unknown Tool ──
  console.log('\n6. Tool Executor — Unknown Tools');

  const result14 = await executor.execute('nonexistentTool', {}, 'user-1');
  assert(result14.success === false, 'Unknown tool fails');
  assertEqual(result14.error?.code, 'UNKNOWN_TOOL', 'Unknown tool returns UNKNOWN_TOOL');

  // ── Rate Limiting ──
  console.log('\n7. Tool Executor — Rate Limiting');

  // Reset rate limiter for clean test
  executor.rateLimiter.reset('user-1', 'createReport');

  const rateResult1 = await executor.execute('createReport', { reportableType: 'review', reportableId: '1', reason: 'test1' }, 'user-1');
  assert(rateResult1.success === true, 'First rate-limited call succeeds');

  const rateResult2 = await executor.execute('createReport', { reportableType: 'review', reportableId: '2', reason: 'test2' }, 'user-1');
  assert(rateResult2.success === true, 'Second rate-limited call succeeds');

  // ── Audit Logging ──
  console.log('\n8. Audit Logging');

  executor.setAuditRepositories(null, mockRepositories.activityLogs);

  await executor.execute('searchPlaces', { city: 'Debrecen' }, 'user-1');
  const log = mockRepositories.activityLogs._lastAuditLog;
  assert(log !== null, 'Audit log was created');
  assert(log.activity_type === 'tool_execution', 'Audit log has correct activity type');
  assert(log.resource_type === 'ai_tool', 'Audit log has correct resource type');
  assert(log.metadata?.tool === 'searchPlaces', 'Audit log records tool name');
  assert(log.metadata?.success === true, 'Audit log records success');

  // Permission denied triggers audit with failure
  await executor.execute('getSavedPlaces', {}, null);
  const failLog1 = mockRepositories.activityLogs._lastAuditLog;
  assert(failLog1 !== null, 'Failed (permission) audit log was created');
  assert(failLog1.metadata?.success === false, 'Failed audit logs success=false');
  assert(failLog1.metadata?.error !== null, 'Failed audit logs error message');

  // Invalid argument triggers audit with failure
  await executor.execute('createReview', { placeId: 'p1', rating: 6 }, 'user-1');
  const failLog2 = mockRepositories.activityLogs._lastAuditLog;
  assert(failLog2 !== null, 'Failed (invalid arg) audit log was created');
  assert(failLog2.metadata?.success === false, 'Invalid arg audit logs success=false');

  // ── Summary ──
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test fatal error:', err);
  process.exit(1);
});
