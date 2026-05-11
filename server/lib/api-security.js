const DEFAULT_ALLOWED_ORIGINS = [
  'https://marketflowjournal.com',
  'https://www.marketflowjournal.com',
  'https://app.marketflowjournal.com',
];

const LOCAL_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const rateLimitBuckets = globalThis.__MFJ_RATE_LIMIT_BUCKETS__ || new Map();
globalThis.__MFJ_RATE_LIMIT_BUCKETS__ = rateLimitBuckets;

const RATE_LIMIT_POLICIES = {
  global: { limit: envNumber('RATE_LIMIT_GLOBAL_PER_MINUTE', 45), windowMs: 60_000, burst: envNumber('RATE_LIMIT_GLOBAL_BURST', 8), blockDurationMs: 30_000 },
  general: { limit: 45, windowMs: 60_000, burst: 8, blockDurationMs: 30_000 },
  auth: { limit: 18, windowMs: 60_000, burst: 5, blockDurationMs: 60_000 },
  stripe: { limit: 10, windowMs: 60_000, burst: 4, blockDurationMs: 60_000 },
  leaderboard: { limit: 60, windowMs: 60_000, burst: 10, blockDurationMs: 30_000 },
  market: { limit: 75, windowMs: 60_000, burst: 14, blockDurationMs: 20_000 },
  brokerSync: { limit: 120, windowMs: 60_000, burst: 24, blockDurationMs: 30_000 },
  support: { limit: 6, windowMs: 600_000, burst: 2, blockDurationMs: 300_000 },
  webhook: { limit: 240, windowMs: 60_000, burst: 60, blockDurationMs: 10_000 },
  cron: { limit: 6, windowMs: 60_000, burst: 2, blockDurationMs: 60_000 },
};

const USER_RATE_LIMIT_POLICIES = {
  general: { limit: 120, windowMs: 60_000, burst: 20, blockDurationMs: 30_000 },
  auth: { limit: 30, windowMs: 60_000, burst: 8, blockDurationMs: 60_000 },
  stripe: { limit: 8, windowMs: 60_000, burst: 3, blockDurationMs: 60_000 },
  leaderboard: { limit: 90, windowMs: 60_000, burst: 15, blockDurationMs: 30_000 },
  market: { limit: 120, windowMs: 60_000, burst: 24, blockDurationMs: 20_000 },
  brokerSync: { limit: 180, windowMs: 60_000, burst: 30, blockDurationMs: 30_000 },
  support: { limit: 4, windowMs: 600_000, burst: 2, blockDurationMs: 300_000 },
};

const CATEGORY_ALIASES = {
  checkout: 'stripe',
  'billing-portal': 'stripe',
  'sync-subscription': 'stripe',
  'create-checkout-session': 'stripe',
  'create-billing-portal': 'stripe',
  onboarding: 'auth',
  auth: 'auth',
  leaderboard: 'leaderboard',
  'market-data': 'market',
  'market-ohlc': 'market',
  market: 'market',
  'broker-sync': 'brokerSync',
  brokersync: 'brokerSync',
  support: 'support',
  'stripe-webhook': 'webhook',
  webhook: 'webhook',
  'cron-leaderboard': 'cron',
  cron: 'cron',
};

const BLOCKED_USER_AGENT_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /acunetix/i,
  /nessus/i,
  /wpscan/i,
  /dirbuster/i,
  /gobuster/i,
  /masscan/i,
  /zgrab/i,
  /nmap/i,
  /hydra/i,
  /libwww-perl/i,
  /havij/i,
  /netsparker/i,
  /jaeles/i,
];

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
  const vercelForwarded = String(req.headers['x-vercel-forwarded-for'] || '').split(',')[0].trim();
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const realIp = String(req.headers['x-real-ip'] || '').trim();
  const candidate = vercelForwarded || realIp || forwarded || req.socket?.remoteAddress || 'unknown';
  return String(candidate).replace(/^::ffff:/, '').slice(0, 128);
}

async function applyRateLimit(req, res, options = {}) {
  if (req.method === 'OPTIONS') return true;

  const category = normalizeCategory(options.category || options.keyPrefix || 'general');
  const blockedAgent = getBlockedUserAgent(req);
  if (blockedAgent) {
    logRateLimitEvent('mfj_abusive_user_agent_blocked', req, {
      category,
      reason: blockedAgent,
      userId: options.userId || null,
    });
    res.status(403).json({ error: 'Request blocked.' });
    return false;
  }

  const route = getRoutePath(req);
  const ip = getClientIp(req);
  const userId = options.userId || options.user?.id || null;
  const checks = [];

  if (!options.skipIp) {
    checks.push({
      scope: 'ip_global',
      key: `ip:global:${ip}`,
      policy: RATE_LIMIT_POLICIES.global,
    });
    checks.push({
      scope: 'ip_route',
      key: `ip:${category}:${route}:${ip}`,
      policy: getRateLimitPolicy(category, RATE_LIMIT_POLICIES, options),
    });
  }

  if (userId) {
    checks.push({
      scope: 'user',
      key: `user:${category}:${userId}`,
      policy: getRateLimitPolicy(category, USER_RATE_LIMIT_POLICIES, options),
    });
  }

  let tightest = null;
  for (const check of checks) {
    const result = await consumeRateLimit(check.key, check.policy, options.cost || 1);
    if (!tightest || result.remaining < tightest.remaining) {
      tightest = { ...result, scope: check.scope, policy: check.policy };
    }
    if (!result.allowed) {
      writeRateLimitHeaders(res, result, check.policy);
      logRateLimitEvent('mfj_rate_limit_blocked', req, {
        category,
        scope: check.scope,
        userId,
        retryAfter: result.retryAfter,
        limit: check.policy.limit,
        windowMs: check.policy.windowMs,
      });
      res.status(429).json({
        error: 'Too many requests. Please slow down and retry shortly.',
        retryAfter: result.retryAfter,
      });
      return false;
    }
  }

  if (tightest) {
    writeRateLimitHeaders(res, tightest, tightest.policy);
  }

  return true;
}

function applyUserRateLimit(req, res, user, options = {}) {
  const userId = typeof user === 'string' ? user : user?.id;
  if (!userId) return true;
  return applyRateLimit(req, res, {
    ...options,
    userId,
    skipIp: true,
  });
}

async function consumeRateLimit(key, policy, cost = 1) {
  const local = consumeLocalToken(key, policy, cost);
  if (!local.allowed) return local;

  const durable = await consumeDurableWindow(key, policy, cost);
  if (!durable) return local;
  if (!durable.allowed) return durable;

  return durable.remaining < local.remaining ? durable : local;
}

async function consumeDurableWindow(key, policy, cost = 1) {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
  if (!url || !token) return null;

  const safePolicy = normalizePolicy(policy);
  const now = Date.now();
  const windowSeconds = Math.max(1, Math.ceil(safePolicy.windowMs / 1000));
  const windowId = Math.floor(now / safePolicy.windowMs);
  const redisKey = `mfj:rate:${key}:${windowId}`;
  const resetAt = (windowId + 1) * safePolicy.windowMs;

  try {
    const count = Number(await redisCommand(url, token, ['INCRBY', redisKey, String(cost)]));
    if (count === cost) {
      await redisCommand(url, token, ['EXPIRE', redisKey, String(windowSeconds + 60)]);
    }

    return {
      allowed: count <= safePolicy.limit,
      remaining: Math.max(0, safePolicy.limit - count),
      retryAfter: Math.max(1, Math.ceil((resetAt - now) / 1000)),
      resetAt,
    };
  } catch (error) {
    console.error('Durable rate limit unavailable:', error.message);
    if (process.env.RATE_LIMIT_FAIL_CLOSED === 'true') {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: 30,
        resetAt: now + 30_000,
      };
    }
    return null;
  }
}

async function redisCommand(url, token, command) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.error) {
    throw new Error(payload.error || `Redis command failed with ${response.status}`);
  }

  return payload.result;
}

function consumeLocalToken(key, policy, cost = 1) {
  const now = Date.now();
  const safePolicy = normalizePolicy(policy);
  const refillRate = safePolicy.limit / (safePolicy.windowMs / 1000);
  const current = rateLimitBuckets.get(key) || {
    tokens: safePolicy.burst,
    updatedAt: now,
    blockedUntil: 0,
  };

  if (current.blockedUntil > now) {
    return {
      allowed: false,
      remaining: Math.max(0, Math.floor(current.tokens || 0)),
      retryAfter: Math.max(1, Math.ceil((current.blockedUntil - now) / 1000)),
      resetAt: current.blockedUntil,
    };
  }

  const elapsedSeconds = Math.max(0, (now - current.updatedAt) / 1000);
  const nextTokens = Math.min(
    safePolicy.burst,
    Number(current.tokens || 0) + elapsedSeconds * refillRate,
  );

  if (nextTokens < cost) {
    const retryAfter = Math.max(1, Math.ceil((cost - nextTokens) / refillRate));
    const blockedUntil = now + Math.max(safePolicy.blockDurationMs, retryAfter * 1000);
    rateLimitBuckets.set(key, {
      tokens: nextTokens,
      updatedAt: now,
      blockedUntil,
    });

    return {
      allowed: false,
      remaining: Math.max(0, Math.floor(nextTokens)),
      retryAfter: Math.max(1, Math.ceil((blockedUntil - now) / 1000)),
      resetAt: blockedUntil,
    };
  }

  const remaining = nextTokens - cost;
  rateLimitBuckets.set(key, {
    tokens: remaining,
    updatedAt: now,
    blockedUntil: 0,
  });

  pruneRateLimitBuckets(now);
  return {
    allowed: true,
    remaining: Math.max(0, Math.floor(remaining)),
    retryAfter: 0,
    resetAt: now + Math.ceil((safePolicy.burst - remaining) / refillRate) * 1000,
  };
}

function writeRateLimitHeaders(res, result, policy) {
  res.setHeader('X-RateLimit-Limit', String(policy.limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, result.remaining)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

  if (!result.allowed) {
    res.setHeader('Retry-After', String(result.retryAfter));
  }
}

function getRateLimitPolicy(category, source, options = {}) {
  const base = source[category] || source.general || RATE_LIMIT_POLICIES.general;
  if (!options.limit && !options.windowMs && !options.burst) return normalizePolicy(base);

  return normalizePolicy({
    ...base,
    limit: options.limit ? Math.min(base.limit, Number(options.limit)) : base.limit,
    windowMs: options.windowMs ? Math.max(base.windowMs, Number(options.windowMs)) : base.windowMs,
    burst: options.burst ? Math.min(base.burst, Number(options.burst)) : base.burst,
    blockDurationMs: options.blockDurationMs || base.blockDurationMs,
  });
}

function normalizePolicy(policy = {}) {
  const limit = Math.max(1, Number(policy.limit) || 45);
  const windowMs = Math.max(1_000, Number(policy.windowMs) || 60_000);
  const burst = Math.max(1, Math.min(limit, Number(policy.burst) || Math.min(limit, 8)));
  const blockDurationMs = Math.max(1_000, Number(policy.blockDurationMs) || 30_000);
  return { limit, windowMs, burst, blockDurationMs };
}

function normalizeCategory(category = 'general') {
  const value = String(category || 'general').trim();
  const key = value.replace(/_/g, '-');
  return CATEGORY_ALIASES[key] || CATEGORY_ALIASES[key.toLowerCase()] || value || 'general';
}

function getRoutePath(req = {}) {
  const raw = req.url || req.originalUrl || '';
  try {
    return new URL(raw, 'https://marketflowjournal.com').pathname || '/';
  } catch (_) {
    return String(raw).split('?')[0] || '/';
  }
}

function getBlockedUserAgent(req = {}) {
  const userAgent = String(req.headers?.['user-agent'] || '').slice(0, 512);
  const match = BLOCKED_USER_AGENT_PATTERNS.find((pattern) => pattern.test(userAgent));
  return match ? match.source : '';
}

function logRateLimitEvent(event, req, details = {}) {
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    ip: getClientIp(req),
    method: req.method || 'UNKNOWN',
    route: getRoutePath(req),
    user_id: details.userId || null,
    category: details.category || 'general',
    scope: details.scope || null,
    retry_after: details.retryAfter || null,
    limit: details.limit || null,
    window_ms: details.windowMs || null,
    reason: details.reason || null,
    user_agent: String(req.headers?.['user-agent'] || '').slice(0, 256) || null,
  };

  console.warn(JSON.stringify(payload));
}

function pruneRateLimitBuckets(now = Date.now()) {
  if (rateLimitBuckets.size < 5_000) return;

  for (const [key, bucket] of rateLimitBuckets.entries()) {
    const updatedAt = Number(bucket.updatedAt || 0);
    const blockedUntil = Number(bucket.blockedUntil || 0);
    if (Math.max(updatedAt, blockedUntil) + 900_000 < now) {
      rateLimitBuckets.delete(key);
    }
  }
}

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
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
  applyUserRateLimit,
  getBearerToken,
  getClientIp,
  handleCors,
  requireSupabaseUser,
  sanitizeProfile,
  sendServerError,
};
