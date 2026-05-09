function brokerSyncEvent(type, payload = {}) {
  return {
    type,
    payload,
    created_at: new Date().toISOString(),
  };
}

module.exports = {
  brokerSyncEvent,
};
