const crypto = require('crypto');
const { createRemoteJWKSet, jwtVerify, decodeProtectedHeader, errors } = require('jose');

function base64UrlDecode(input) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function parseJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.log('[AUTH_DEBUG] parseJwt: malformed token, parts=' + parts.length);
    throw Object.assign(new Error('Malformed token'), { code: 'MALFORMED_TOKEN' });
  }
  const header = JSON.parse(base64UrlDecode(parts[0]));
  const payload = JSON.parse(base64UrlDecode(parts[1]));
  console.log('[AUTH_DEBUG] parseJwt: alg=' + header.alg + ' sub=' + payload.sub + ' iss=' + (payload.iss || 'none') + ' aud=' + (payload.aud || 'none') + ' exp=' + payload.exp);
  return { header, payload, signature: parts[2], signedPart: `${parts[0]}.${parts[1]}` };
}

function verifyHs256(token, secret) {
  const parsed = parseJwt(token);
  console.log('[AUTH_DEBUG] verifyHs256: alg=' + parsed.header.alg + ' exp=' + parsed.payload.exp + ' now=' + Math.floor(Date.now() / 1000));
  if (parsed.header.alg !== 'HS256') {
    console.log('[AUTH_DEBUG] verifyHs256: alg mismatch, expected HS256 got ' + parsed.header.alg);
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
    console.log('[AUTH_DEBUG] verifyHs256: signature mismatch');
    throw Object.assign(new Error('Invalid token signature'), { code: 'INVALID_SIGNATURE' });
  }

  const now = Math.floor(Date.now() / 1000);
  if (parsed.payload.exp && parsed.payload.exp < now) {
    console.log('[AUTH_DEBUG] verifyHs256: token expired exp=' + parsed.payload.exp + ' now=' + now);
    throw Object.assign(new Error('Expired token'), { code: 'TOKEN_EXPIRED' });
  }

  console.log('[AUTH_DEBUG] verifyHs256: SUCCESS');
  return parsed.payload;
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  const headerKeys = Object.keys(req.headers).filter(k => k.toLowerCase().startsWith('authorization'));
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    console.log('[AUTH_DEBUG] getBearerToken: no Bearer match. authHeader keys=' + JSON.stringify(headerKeys) + ' raw=' + authHeader.substring(0, 50));
  }
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
    console.log('[AUTH_DEBUG] verifyJwtWithJwks: alg=' + header.alg + ' is not ES/RS, returning null');
    return null;
  }

  const jwks = getJwksRemoteSet(jwksUrl);
  try {
    console.log('[AUTH_DEBUG] verifyJwtWithJwks: calling jwtVerify with jwksUrl=' + jwksUrl);
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ['ES256', 'ES384', 'ES512', 'RS256', 'RS384', 'RS512'],
    });
    console.log('[AUTH_DEBUG] verifyJwtWithJwks: SUCCESS, iss=' + payload.iss + ' sub=' + payload.sub + ' aud=' + payload.aud);
    return payload;
  } catch (err) {
    console.log('[AUTH_DEBUG] verifyJwtWithJwks: jwtVerify threw code=' + err.code + ' message=' + err.message);
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
    console.log('[AUTH_DEBUG] No Bearer token found in Authorization header');
    return { ok: false, statusCode: 401, code: 'AUTH_REQUIRED', message: 'Authentication is required.' };
  }

  const hasJwks = Boolean(env.supabase.jwksUrl);
  const hasSecret = Boolean(env.supabase.jwtSecret);
  console.log('[AUTH_DEBUG] hasJwks=' + hasJwks + ' hasSecret=' + hasSecret + ' jwksUrl=' + env.supabase.jwksUrl + ' jwtSecretLength=' + (env.supabase.jwtSecret ? env.supabase.jwtSecret.length : 0));

  if (!hasJwks && !hasSecret) {
    console.log('[AUTH_DEBUG] Neither JWKS nor JWT secret configured');
    return { ok: false, statusCode: 503, code: 'AUTH_NOT_CONFIGURED', message: 'Authentication is not configured.' };
  }

  if (hasJwks) {
    const header = decodeProtectedHeader(token);
    console.log('[AUTH_DEBUG] JWT header alg=' + header.alg + ' kid=' + (header.kid || 'none'));
    if (header.alg && (header.alg.startsWith('ES') || header.alg.startsWith('RS'))) {
      try {
        console.log('[AUTH_DEBUG] Attempting JWKS verification...');
        const claims = await verifyJwtWithJwks(token, env.supabase.jwksUrl);
        const userId = claims.sub;
        console.log('[AUTH_DEBUG] JWKS verification SUCCEEDED, sub=' + userId);
        if (!userId) {
          return { ok: false, statusCode: 401, code: 'INVALID_TOKEN', message: 'Token subject is missing.' };
        }
        return { ok: true, user: { id: userId, claims } };
      } catch (jwksError) {
        console.log('[AUTH_DEBUG] JWKS verification FAILED: code=' + jwksError.code + ' message=' + jwksError.message);
        if (!hasSecret) {
          return { ok: false, statusCode: 401, code: jwksError.code || 'JWKS_VERIFICATION_FAILED', message: jwksError.message || 'Invalid authentication token.' };
        }
        console.log('[AUTH_DEBUG] Falling through to HS256 since hasSecret=true');
      }
    } else {
      console.log('[AUTH_DEBUG] JWT alg=' + header.alg + ' not ES/RS, falling through to HS256');
    }
  }

  if (!hasSecret) {
    console.log('[AUTH_DEBUG] No JWT secret configured for fallback');
    return { ok: false, statusCode: 401, code: 'UNSUPPORTED_ALG', message: 'Unsupported token algorithm.' };
  }

  try {
    console.log('[AUTH_DEBUG] Attempting HS256 verification...');
    const claims = verifyHs256(token, env.supabase.jwtSecret);
    const userId = claims.sub;
    console.log('[AUTH_DEBUG] HS256 verification SUCCEEDED, sub=' + userId);
    if (!userId) {
      return { ok: false, statusCode: 401, code: 'INVALID_TOKEN', message: 'Token subject is missing.' };
    }
    return { ok: true, user: { id: userId, claims } };
  } catch (error) {
    console.log('[AUTH_DEBUG] HS256 verification FAILED: code=' + error.code + ' message=' + error.message);
    return { ok: false, statusCode: 401, code: error.code || 'INVALID_TOKEN', message: error.message || 'Invalid authentication token.' };
  }
}

module.exports = {
  authenticateRequest,
  parseJwt,
  verifyHs256,
};
