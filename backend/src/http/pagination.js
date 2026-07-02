const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

function parsePagination(url) {
  const limit = Math.min(
    Math.max(Number.parseInt(url.searchParams.get('limit')) || DEFAULT_PAGE_LIMIT, 1),
    MAX_PAGE_LIMIT
  );
  const offset = Math.max(Number.parseInt(url.searchParams.get('offset')) || 0, 0);
  const page = Math.max(Number.parseInt(url.searchParams.get('page')) || 1, 1);
  const cursor = url.searchParams.get('cursor') || null;
  const cursorField = url.searchParams.get('cursor_field') || 'created_at';

  return { limit, offset, page, cursor, cursorField };
}

function buildOffsetResponse(data, total, params) {
  const { limit, offset } = params;
  return {
    data,
    pagination: {
      type: 'offset',
      limit,
      offset,
      total: total ?? data.length,
      hasMore: total ? offset + limit < total : data.length === limit,
    },
  };
}

function buildCursorResponse(data, params, encodeCursor) {
  const { limit, cursorField } = params;
  const lastItem = data.length > 0 ? data[data.length - 1] : null;
  const nextCursor = lastItem && data.length === limit
    ? (encodeCursor ? encodeCursor(lastItem[cursorField]) : lastItem[cursorField])
    : null;

  return {
    data,
    pagination: {
      type: 'cursor',
      limit,
      cursorField,
      nextCursor,
      hasMore: nextCursor !== null,
    },
  };
}

function encodeCursor(value) {
  if (value === null || value === undefined) return null;
  return Buffer.from(String(value)).toString('base64url');
}

function decodeCursor(encoded) {
  if (!encoded) return null;
  try {
    return Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

module.exports = {
  parsePagination,
  buildOffsetResponse,
  buildCursorResponse,
  encodeCursor,
  decodeCursor,
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
};
