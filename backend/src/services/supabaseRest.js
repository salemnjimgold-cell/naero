function createSupabaseRestClient(env, fetchImpl = fetch) {
  const { url, serviceRoleKey } = env.supabase;
  const configured = Boolean(url && serviceRoleKey);

  async function request(path, options = {}) {
    if (!configured) {
      return { data: null, error: { code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase admin access is not configured.' } };
    }

    const response = await fetchImpl(`${url}/rest/v1${path}`, {
      ...options,
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        'content-type': 'application/json',
        prefer: 'return=representation',
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      return { data: null, error: { code: 'SUPABASE_REST_ERROR', status: response.status, message: data?.message || response.statusText } };
    }
    return { data, error: null };
  }

  return {
    configured,
    getProfile: (userId) => request(`/profiles?id=eq.${encodeURIComponent(userId)}&select=*`),
    upsertProfile: (userId, profile) => request('/profiles', {
      method: 'POST',
      body: JSON.stringify([{ ...profile, id: userId }]),
      headers: { prefer: 'resolution=merge-duplicates,return=representation' },
    }),
  };
}

module.exports = {
  createSupabaseRestClient,
};
