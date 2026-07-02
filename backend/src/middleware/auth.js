const crypto = require('crypto');
const { createRemoteJWKSet, jwtVerify, decodeProtectedHeader, errors } = require('jose');

function base64UrlDecode(input) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function parseJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw Object.assign(new Error('Malformed token'), { code: 'MALFORMED_TOKEN' });
  }
  const header = JSON.parse(base64UrlDecode(parts[0]));
  const payload = JSON.parse(base64UrlDecode(parts[1]));
  return { header, payload, signature: parts[2], signedPart: `${parts[0]}.${parts[1]}` };
}

function verifyHs256(token, secret) {
  const parsed = parseJwt(token);
  if (parsed.header.alg !== 'HS256') {
    throw Object.assign(new Error('Unsupported token algorithm'), { code: 'UNSUPPORTED_ALG' });
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(parsed.signedPart)
    .digest('base64url');

  if (
    expected.length !== parsed.signature.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parsed.signature))
  ) {
    throw Object.assign(new Error('Invalid token signature'), { code: 'INVALID_SIGNATURE' });
  }

  const now = Math.floor(Date.now() / 1000);
  if (parsed.payload.exp && parsed.payload.exp < now) {
    throw Object.assign(new Error('Expired token'), { code: 'TOKEN_EXPIRED' });
  }

  return parsed.payload;
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

const jwksCache = new Map();

function getJwksRemoteSet(jwksUrl) {
  if (!jwksCache.has(jwksUrl)) {
    const remoteSet = createRemoteJWKSet(new URL(jwksUrl), {
      cacheMaxAge: 600000,
      cooldownDuration: 30000,
      timeout: 10000,
    });
    jwksCache.set(jwksUrl, remoteSet);
  }
  return jwksCache.get(jwksUrl);
}

async function verifyJwtWithJwks(token, jwksUrl) {
  const header = decodeProtectedHeader(token);
  if (!header.alg || !header.alg.startsWith('ES') && !header.alg.startsWith('RS')) {
    return null;
  }

  const jwks = getJwksRemoteSet(jwksUrl);
  try {
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ['ES256', 'ES384', 'ES512', 'RS256', 'RS384', 'RS512'],
    });
    return payload;
  } catch (err) {
    if (err.code === 'ERR_JWT_EXPIRED') {
      throw Object.assign(new Error('Expired token'), { code: 'TOKEN_EXPIRED' });
    }
    if (err.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      throw Object.assign(new Error('Invalid token signature'), { code: 'INVALID_SIGNATURE' });
    }
    throw Object.assign(new Error(`JWKS verification failed: ${err.message}`), { code: 'JWKS_VERIFICATION_FAILED' });
  }
}

async function authenticateRequest(req, env) {
  const token = getBearerToken(req);
  if (!token) {
    return { ok: false, statusCode: 401, code: 'AUTH_REQUIRED', message: 'Authentication is required.' };
  }

  const hasJwks = Boolean(env.supabase.jwksUrl);
  const hasSecret = Boolean(env.supabase.jwtSecret);

  if (!hasJwks && !hasSecret) {
    return { ok: false, statusCode: 503, code: 'AUTH_NOT_CONFIGURED', message: 'Authentication is not configured.' };
  }

  try {
    if (hasJwks) {
      const header = decodeProtectedHeader(token);
      if (header.alg && (header.alg.startsWith('ES') || header.alg.startsWith('RS'))) {
        const claims = await verifyJwtWithJwks(token, env.supabase.jwksUrl);
        const userId = claims.sub;
        if (!userId) {
          return { ok: false, statusCode: 401, code: 'INVALID_TOKEN', message: 'Token subject is missing.' };
        }
        return { ok: true, user: { id: userId, claims } };
      }
    }

    if (!hasSecret) {
      return { ok: false, statusCode: 401, code: 'UNSUPPORTED_ALG', message: 'Unsupported token algorithm.' };
    }

    const claims = verifyHs256(token, env.supabase.jwtSecret);
    const userId = claims.sub;
    if (!userId) {
      return { ok: false, statusCode: 401, code: 'INVALID_TOKEN', message: 'Token subject is missing.' };
    }
    return { ok: true, user: { id: userId, claims } };
  } catch (error) {
    return { ok: false, statusCode: 401, code: error.code || 'INVALID_TOKEN', message: 'Invalid authentication token.' };
  }
}

module.exports = {
  authenticateRequest,
  parseJwt,
  verifyHs256,
};
