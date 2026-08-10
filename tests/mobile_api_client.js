const assert = require('node:assert/strict');
const { normalizeApiFailure, createRequestId } = require('../src/services/apiClientCore');

const timeout = normalizeApiFailure(Object.assign(new Error('aborted'), { name: 'AbortError' }));
assert.deepEqual(timeout, { code: 'REQUEST_TIMEOUT', message: 'The request timed out.' });

const network = normalizeApiFailure(new Error('socket secret internal detail'));
assert.deepEqual(network, { code: 'NETWORK_ERROR', message: 'The service could not be reached.' });

const first = createRequestId();
const second = createRequestId();
assert.match(first, /^mobile-/);
assert.notEqual(first, second);

console.log('Mobile API client tests: 3/3 passed');
