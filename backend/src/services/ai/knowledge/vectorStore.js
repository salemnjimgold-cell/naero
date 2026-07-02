function createVectorStore(env, fetchImpl = fetch) {
  const { url, serviceRoleKey } = env.supabase;
  const configured = Boolean(url && serviceRoleKey);

  const TABLE = '/knowledge_embeddings';
  const RPC_BASE = `${url}/rest/v1/rpc`;

  async function request(method, path, options = {}) {
    if (!configured) {
      return { data: null, error: { code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase admin access is not configured.' } };
    }

    const apiUrl = `${url}/rest/v1${path}`;
    const response = await fetchImpl(apiUrl, {
      method,
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        'content-type': 'application/json',
        prefer: 'return=representation',
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
    if (!response.ok) {
      return { data: null, error: { code: 'VECTOR_STORE_ERROR', status: response.status, message: typeof data === 'string' ? data : data?.message || response.statusText } };
    }
    return { data, error: null };
  }

  async function insert(entries) {
    return request('POST', TABLE, { body: Array.isArray(entries) ? entries : [entries] });
  }

  async function upsert(entries) {
    const items = Array.isArray(entries) ? entries : [entries];
    return request('POST', TABLE, {
      body: items,
      headers: { prefer: 'resolution=merge-duplicates,return=representation' },
    });
  }

  async function remove(sourceType, sourceId) {
    const params = `source_type=eq.${encodeURIComponent(sourceType)}&source_id=eq.${encodeURIComponent(sourceId)}`;
    return request('DELETE', `${TABLE}?${params}`);
  }

  async function removeBySourceType(sourceType) {
    return request('DELETE', `${TABLE}?source_type=eq.${encodeURIComponent(sourceType)}`);
  }

  async function semanticSearch(queryEmbedding, options = {}) {
    const threshold = options.threshold ?? 0.7;
    const matchCount = options.matchCount ?? 10;
    const sourceType = options.sourceType || null;
    const metadata = options.metadata || null;

    const body = {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: matchCount,
      filter_source_type: sourceType,
      filter_metadata: metadata,
    };

    const url = `${RPC_BASE}/match_knowledge`;
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      return { data: null, error: { code: 'SEARCH_ERROR', status: response.status, message: data?.message || response.statusText } };
    }
    return { data, error: null };
  }

  async function hybridSearch(queryEmbedding, queryText, options = {}) {
    const threshold = options.threshold ?? 0.7;
    const matchCount = options.matchCount ?? 10;
    const sourceType = options.sourceType || null;
    const vectorWeight = options.vectorWeight ?? 0.7;
    const keywordWeight = options.keywordWeight ?? 0.3;

    const body = {
      query_embedding: queryEmbedding,
      query_text: queryText,
      match_threshold: threshold,
      match_count: matchCount,
      filter_source_type: sourceType,
      vector_weight: vectorWeight,
      keyword_weight: keywordWeight,
    };

    const url = `${RPC_BASE}/match_knowledge_hybrid`;
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      return { data: null, error: { code: 'SEARCH_ERROR', status: response.status, message: data?.message || response.statusText } };
    }
    return { data, error: null };
  }

  async function count(sourceType) {
    const params = sourceType
      ? `select=id&source_type=eq.${encodeURIComponent(sourceType)}`
      : 'select=id';
    return request('GET', `${TABLE}?${params}`);
  }

  return {
    configured,
    insert,
    upsert,
    remove,
    removeBySourceType,
    semanticSearch,
    hybridSearch,
    count,
  };
}

module.exports = { createVectorStore };
