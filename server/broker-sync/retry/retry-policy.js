const DEFAULT_RETRY_POLICY = Object.freeze({
  maxAttempts: 5,
  baseDelayMs: 750,
  maxDelayMs: 30000,
});

function nextRetryDelay(attempt = 0, policy = DEFAULT_RETRY_POLICY) {
  const safeAttempt = Math.max(0, Number(attempt) || 0);
  const delay = Math.min(policy.maxDelayMs, policy.baseDelayMs * (2 ** safeAttempt));
  const jitter = Math.round(delay * 0.18 * Math.random());
  return delay + jitter;
}

function shouldRetrySync(error = {}, attempt = 0, policy = DEFAULT_RETRY_POLICY) {
  if (attempt >= policy.maxAttempts) return false;
  const text = [error.message, error.details, error.code, error.status].filter(Boolean).join(' ').toLowerCase();
  return text.includes('timeout')
    || text.includes('rate')
    || text.includes('network')
    || text.includes('temporar')
    || String(error.status || '').startsWith('5');
}

module.exports = {
  DEFAULT_RETRY_POLICY,
  nextRetryDelay,
  shouldRetrySync,
};
