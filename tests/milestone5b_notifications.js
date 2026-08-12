const assert = require('assert');
const { createNotificationRoutes } = require('../backend/src/routes/notifications');
const { createNotificationsRepository } = require('../backend/src/services/repositories/notificationsRepository');

function request(method, path) {
  return { method, headers: {} };
}

async function routeTests() {
  const calls = [];
  const notifications = {
    getUnreadCount: async (userId) => ({ data: userId === 'owner' ? [{ id: '1' }, { id: '2' }] : [], error: null }),
    getById: async (id, userId) => ({ data: id === 'owned' && userId === 'owner' ? [{ id, user_id: userId }] : [], error: null }),
    markRead: async (id, userId) => {
      calls.push({ operation: 'markRead', id, userId });
      return { data: id === 'owned' && userId === 'owner' ? [{ id }] : [], error: null };
    },
    markAllRead: async (userId) => {
      calls.push({ operation: 'markAllRead', userId });
      return { data: [{ id: 'owned' }], error: null };
    },
  };
  const routes = createNotificationRoutes({}, { notifications });
  const owner = { ok: true, user: { id: 'owner' } };
  const other = { ok: true, user: { id: 'other' } };

  const count = await routes.handleNotifications(request('GET'), null, new URL('http://test/v1/notifications/unread-count'), owner);
  assert.strictEqual(count.status, 200);
  assert.deepStrictEqual(count.body, { data: { count: 2 } });
  assert.strictEqual(Object.hasOwn(count.body.data, 'unread'), false);

  const owned = await routes.handleNotifications(request('PUT'), null, new URL('http://test/v1/notifications/owned'), owner);
  assert.strictEqual(owned.status, 200);
  assert.deepStrictEqual(calls.at(-1), { operation: 'markRead', id: 'owned', userId: 'owner' });

  const crossUser = await routes.handleNotifications(request('PUT'), null, new URL('http://test/v1/notifications/owned'), other);
  assert.strictEqual(crossUser.status, 404);
  assert.deepStrictEqual(calls.at(-1), { operation: 'markRead', id: 'owned', userId: 'other' });

  const invalid = await routes.handleNotifications(request('PUT'), null, new URL('http://test/v1/notifications/missing'), owner);
  assert.strictEqual(invalid.status, 404);

  const unauthenticated = await routes.handleNotifications(request('PUT'), null, new URL('http://test/v1/notifications/owned'), { ok: false, statusCode: 401, code: 'AUTH_REQUIRED', message: 'Authentication required.' });
  assert.strictEqual(unauthenticated.status, 401);

  const readAll = await routes.handleNotifications(request('PUT'), null, new URL('http://test/v1/notifications/read-all'), owner);
  assert.strictEqual(readAll.status, 200);
  assert.deepStrictEqual(calls.at(-1), { operation: 'markAllRead', userId: 'owner' });
  assert.strictEqual(calls.some(call => call.operation === 'markRead' && call.id === 'read-all'), false);
}

async function repositoryTests() {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url, options });
    return { ok: true, status: 200, text: async () => JSON.stringify([{ id: 'notification' }]) };
  };
  const repository = createNotificationsRepository('https://example.supabase.co', 'server-role-placeholder', fetchImpl);
  await repository.getById('notification', 'owner');
  await repository.markRead('notification', 'owner');
  assert(requests[0].url.includes('id=eq.notification'));
  assert(requests[0].url.includes('user_id=eq.owner'));
  assert(requests[1].url.includes('id=eq.notification'));
  assert(requests[1].url.includes('user_id=eq.owner'));
}

Promise.resolve()
  .then(routeTests)
  .then(repositoryTests)
  .then(() => console.log('Milestone 5B notification security: passed'))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
