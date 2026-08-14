const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const {
  classifyRuntimeFlag,
  emitLde3RuntimeFlagDiagnostics,
} = require('../backend/src/config/runtimeFlagDiagnostic');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('classifies only exact true and false values', () => {
  assert.deepEqual(classifyRuntimeFlag(undefined), {
    present: false, rawLength: 0, trimmedLength: 0, classification: 'ABSENT',
  });
  assert.deepEqual(classifyRuntimeFlag(null), {
    present: false, rawLength: 0, trimmedLength: 0, classification: 'ABSENT',
  });
  assert.deepEqual(classifyRuntimeFlag('true'), {
    present: true, rawLength: 4, trimmedLength: 4, classification: 'TRUE',
  });
  assert.deepEqual(classifyRuntimeFlag('false'), {
    present: true, rawLength: 5, trimmedLength: 5, classification: 'FALSE',
  });
});

test('classifies whitespace, case, quotes, and newlines as malformed', () => {
  const cases = [
    [' true', 5, 4],
    ['true ', 5, 4],
    ['TRUE', 4, 4],
    ['"true"', 6, 6],
    ['true\n', 5, 4],
  ];
  for (const [value, rawLength, trimmedLength] of cases) {
    assert.deepEqual(classifyRuntimeFlag(value), {
      present: true, rawLength, trimmedLength, classification: 'MALFORMED',
    });
  }
});

test('unexpected non-string values fail closed without invoking properties', () => {
  const hostile = Object.create(null, {
    toString: { get() { throw new Error('must not inspect'); } },
  });
  assert.deepEqual(classifyRuntimeFlag(hostile), {
    present: true, rawLength: 0, trimmedLength: 0, classification: 'MALFORMED',
  });
});

test('emits only allowlisted flag and parsed-state fields', () => {
  const entries = [];
  const secretValue = ' true-private-host-token ';
  emitLde3RuntimeFlagDiagnostics({
    rawPersistenceValue: secretValue,
    env: { gateway: { discoveredStoreEnabled: true, discoveredPersistenceEnabled: false } },
    log: (message, meta) => entries.push({ message, meta }),
  });

  assert.equal(entries.length, 2);
  assert.deepEqual(Object.keys(entries[0].meta).sort(), [
    'classification', 'event', 'flagName', 'present', 'rawLength', 'trimmedLength',
  ]);
  assert.deepEqual(Object.keys(entries[1].meta).sort(), [
    'discoveredPersistenceEnabled', 'discoveredStoreEnabled', 'event',
  ]);
  assert.equal(entries[0].meta.classification, 'MALFORMED');
  assert.equal(entries[1].meta.discoveredStoreEnabled, true);
  assert.equal(entries[1].meta.discoveredPersistenceEnabled, false);

  const serialized = JSON.stringify(entries);
  assert.equal(serialized.includes(secretValue), false);
  assert.equal(serialized.includes('private-host'), false);
  assert.equal(serialized.includes('token '), false);
  assert.equal(serialized.includes('process.env'), false);
});

test('backend startup emits one safe flag event and one parsed-state event', () => {
  const workspace = path.resolve(__dirname, '..');
  const secretValue = ' true-startup-private-token ';
  const script = [
    "const { startServer } = require('./backend/src/server');",
    'const server = startServer();',
    "server.on('listening', () => server.close());",
  ].join(' ');
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: workspace,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      SERVICE_ENV: 'development',
      PORT: '0',
      DISCOVERED_PLACE_STORE_ENABLED: 'true',
      DISCOVERED_PLACE_PERSISTENCE_ENABLED: secretValue,
    },
    encoding: 'utf8',
    timeout: 10_000,
  });

  assert.equal(result.status, 0, result.stderr);
  const entries = result.stdout.trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  const flagEvents = entries.filter((entry) => entry.event === 'lde3_runtime_flag');
  const stateEvents = entries.filter((entry) => entry.event === 'lde3_parsed_state');
  assert.equal(flagEvents.length, 1);
  assert.equal(stateEvents.length, 1);
  assert.equal(flagEvents[0].classification, 'MALFORMED');
  assert.equal(flagEvents[0].rawLength, secretValue.length);
  assert.equal(flagEvents[0].trimmedLength, secretValue.trim().length);
  assert.equal(stateEvents[0].discoveredStoreEnabled, true);
  assert.equal(stateEvents[0].discoveredPersistenceEnabled, false);
  const output = `${result.stdout}${result.stderr}`;
  assert.equal(output.includes(secretValue), false);
  assert.equal(output.includes('startup-private'), false);
});

(async () => {
  let passed = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      passed += 1;
      console.log(`PASS ${name}`);
    } catch (error) {
      console.error(`FAIL ${name}`);
      console.error(error);
      process.exitCode = 1;
    }
  }
  console.log(`${passed}/${tests.length} runtime flag diagnostic tests passed`);
})();
