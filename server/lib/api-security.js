const DEFAULT_ALLOWED_ORIGINS = [
  'https://marketflowjournal.com',
  'https://www.marketflowjournal.com',
  'https://app.marketflowjournal.com',
];

const LOCAL_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const rateLimitBuckets = globalThis.__MFJ_RATE_LIMIT_BUCKETS__ || new Map();
globalThis.__MFJ_RATE_LIMIT_BUCKETS__ = rateLimitBuckets;

function getAllowedOrigins() {
  const configured = [
    process.env.ALLOWED_ORIGINS,
    process.env.CORS_ALLOWED_ORIGINS,
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]);
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (getAllowedOrigins().has(origin)) return true;
  return process.env.NODE_ENV !== 'production' && LOCAL_ORIGIN_PATTERN.test(origin);
}

function applyCors(req, res, options = {}) {
  const origin = req.headers.origin || '';
  const methods = options.methods || 'GET, POST, OPTIONS';
  const headers = options.headers || 'Content-Type, Authorization';

  res.setHeader('Vary', appendVary(res.getHeader('Vary'), 'Origin'));
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', headers);
  res.setHeader('Access-Control-Max-Age', '86400');

  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return true;
  }

  return !origin;
}

function handleCors(req, res, options = {}) {
  const allowed = applyCors(req, res, options);

  if (req.method === 'OPTIONS') {
    return res.status(allowed ? 204 : 403).end();
  }

  if (!allowed) {
    res.status(403).json({ error: 'Origin not allowed' });
    return true;
  }

  return false;
}

function appendVary(current, value) {
  if (!current) return value;
  const parts = String(current).split(',').map((part) => part.trim().toLowerCase());
  return parts.includes(value.toLowerCase()) ? current : `${current}, ${value}`;
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

function applyRateLimit(req, res, options = {}) {
  const windowMs = options.windowMs || 60_000;
  const limit = options.limit || 60;
  const keyPrefix = options.keyPrefix || 'api';
  const identity = options.identity || getClientIp(req);
  const key = `${keyPrefix}:${identity}`;
  const now = Date.now();
  const current = rateLimitBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  current.count += 1;
  if (current.count <= limit) return true;

  const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  res.setHeader('Retry-After', String(retryAfter));
  res.status(429).json({ error: 'Too many requests. Please slow down and retry shortly.' });
  return false;
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = String(authHeader).replace(/^Bearer\s+/i, '').trim();
  return token || null;
}

async function requireSupabaseUser(supabase, req, options = {}) {
  const accessToken = getBearerToken(req);
  if (!accessToken) {
    return { status: 401, error: 'Authorization required', user: null };
  }

  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    const user = data?.user || null;
    if (error || !user?.id) {
      return { status: 401, error: 'Invalid or expired session', user: null };
    }

    if (options.requireConfirmedEmail && !user.email_confirmed_at) {
      return { status: 403, error: 'Email confirmation required', user: null };
    }

    return { status: 200, error: null, user };
  } catch (error) {
    console.error('Supabase auth verification failed:', error.message);
    return { status: 401, error: 'Invalid or expired session', user: null };
  }
}

function sanitizeProfile(profile = null) {
  if (!profile) return null;
  const {
    stripe_customer_id: _stripeCustomerId,
    stripe_subscription_id: _stripeSubscriptionId,
    ...safeProfile
  } = profile;
  return safeProfile;
}

function sendServerError(res, publicMessage = 'Internal server error') {
  return res.status(500).json({ error: publicMessage });
}

module.exports = {
  applyCors,
  applyRateLimit,
  getBearerToken,
  getClientIp,
  handleCors,
  requireSupabaseUser,
  sanitizeProfile,
  sendServerError,
};
