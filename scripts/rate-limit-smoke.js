const { applyRateLimit, applyUserRateLimit } = require('../server/lib/api-security');

function makeReq({ method = 'POST', url = '/api/onboarding', ip = '203.0.113.10', userAgent = 'MarketFlowSmoke/1.0' } = {}) {
  return {
    method,
    url,
    headers: {
      'x-forwarded-for': ip,
      'user-agent': userAgent,
      origin: 'https://app.marketflowjournal.com',
    },
    socket: { remoteAddress: ip },
  };
}

function makeRes() {
  const headers = {};
  return {
    statusCode: 200,
    body: null,
    headers,
    setHeader(key, value) {
      headers[key.toLowerCase()] = String(value);
    },
    getHeader(key) {
      return headers[String(key).toLowerCase()];
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {
      return this;
    },
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runBurstTest() {
  const statuses = [];
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (message) => warnings.push(String(message));

  try {
    for (let index = 0; index < 20; index += 1) {
      const res = makeRes();
      const allowed = await applyRateLimit(makeReq(), res, { category: 'auth', keyPrefix: 'onboarding' });
      statuses.push(allowed ? 200 : res.statusCode);
    }
  } finally {
    console.warn = originalWarn;
  }

  assert(statuses.includes(429), 'Expected 20 rapid auth requests to trigger HTTP 429.');
  assert(warnings.some((line) => line.includes('mfj_rate_limit_blocked')), 'Expected a structured rate-limit log line.');
}

async function runOptionsTest() {
  const res = makeRes();
  const allowed = await applyRateLimit(makeReq({ method: 'OPTIONS', ip: '203.0.113.11' }), res, { category: 'auth' });
  assert(allowed, 'OPTIONS requests must not be rate limited.');
  assert(res.statusCode === 200, 'OPTIONS rate-limit helper should not mutate response status.');
}

async function runUserLimitTest() {
  const statuses = [];
  for (let index = 0; index < 10; index += 1) {
    const res = makeRes();
    const allowed = await applyUserRateLimit(
      makeReq({ url: '/api/create-checkout-session', ip: '203.0.113.12' }),
      res,
      { id: 'smoke-user-1' },
      { category: 'stripe', keyPrefix: 'checkout-user' },
    );
    statuses.push(allowed ? 200 : res.statusCode);
  }

  assert(statuses.includes(429), 'Expected authenticated Stripe abuse to trigger HTTP 429.');
}

async function runBadUserAgentTest() {
  const res = makeRes();
  const allowed = await applyRateLimit(
    makeReq({ ip: '203.0.113.13', userAgent: 'sqlmap/1.7' }),
    res,
    { category: 'auth' },
  );

  assert(!allowed, 'Known abusive user-agent should be blocked.');
  assert(res.statusCode === 403, 'Known abusive user-agent should receive HTTP 403.');
}

async function main() {
  await runBurstTest();
  await runOptionsTest();
  await runUserLimitTest();
  await runBadUserAgentTest();
  console.log('Rate limit smoke tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
