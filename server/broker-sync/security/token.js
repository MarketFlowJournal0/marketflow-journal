function resolveToken(req = {}, mode = '') {
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  const bearer = String(authHeader).replace(/^Bearer\s+/i, '').trim();
  const body = req.body || {};
  const query = req.query || {};

  if (mode === 'webhook') {
    return query.token || body.api_token || body.token || bearer;
  }

  return body.api_token || body.token || query.token || bearer;
}

function maskToken(token = '') {
  const value = String(token || '');
  if (value.length <= 10) return '***';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

module.exports = {
  maskToken,
  resolveToken,
};
