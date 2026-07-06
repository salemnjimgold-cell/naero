import { naeroApi } from './naeroApi';

export function createNaeroNotifications(apiClient = naeroApi) {
  async function getAll(limit = 20, offset = 0) {
    return apiClient.get(`/v1/notifications?limit=${limit}&offset=${offset}`);
  }

  async function getUnreadCount() {
    return apiClient.get('/v1/notifications/unread-count');
  }

  async function markRead(id) {
    return apiClient.put(`/v1/notifications/${id}`, { read: true });
  }

  async function markAllRead() {
    return apiClient.put('/v1/notifications/read-all', {});
  }

  async function create(notification) {
    return apiClient.post('/v1/notifications', notification);
  }

  return {
    getAll,
    getUnreadCount,
    markRead,
    markAllRead,
    create,
  };
}

export const naeroNotifications = createNaeroNotifications();
