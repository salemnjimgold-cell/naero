const PERSISTENCE_FLAG_NAME = 'DISCOVERED_PLACE_PERSISTENCE_ENABLED';

function classifyRuntimeFlag(value) {
  if (value === undefined || value === null) {
    return {
      present: false,
      rawLength: 0,
      trimmedLength: 0,
      classification: 'ABSENT',
    };
  }

  if (typeof value !== 'string') {
    return {
      present: true,
      rawLength: 0,
      trimmedLength: 0,
      classification: 'MALFORMED',
    };
  }

  return {
    present: true,
    rawLength: value.length,
    trimmedLength: value.trim().length,
    classification: value === 'true' ? 'TRUE' : value === 'false' ? 'FALSE' : 'MALFORMED',
  };
}

function emitLde3RuntimeFlagDiagnostics({ rawPersistenceValue, env, log }) {
  log('LDE-3 runtime flag diagnostic', {
    event: 'lde3_runtime_flag',
    flagName: PERSISTENCE_FLAG_NAME,
    ...classifyRuntimeFlag(rawPersistenceValue),
  });
  log('LDE-3 parsed state diagnostic', {
    event: 'lde3_parsed_state',
    discoveredStoreEnabled: env?.gateway?.discoveredStoreEnabled === true,
    discoveredPersistenceEnabled: env?.gateway?.discoveredPersistenceEnabled === true,
  });
}

module.exports = {
  PERSISTENCE_FLAG_NAME,
  classifyRuntimeFlag,
  emitLde3RuntimeFlagDiagnostics,
};
