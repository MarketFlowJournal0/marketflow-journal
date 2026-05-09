function resolveTradesFromPayload(body = {}, mode = '') {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.trades)) return body.trades;
  if (body.trades && typeof body.trades === 'object') return [body.trades];
  if (Array.isArray(body.orders)) return body.orders;
  if (Array.isArray(body.positions)) return body.positions;
  if (mode === 'webhook' && body && Object.keys(body).length) return [body];
  return [];
}

function resolveHeartbeatFromPayload(body = {}) {
  return body.heartbeat
    || body.account_info
    || body.accountInfo
    || body.account
    || null;
}

module.exports = {
  resolveHeartbeatFromPayload,
  resolveTradesFromPayload,
};
