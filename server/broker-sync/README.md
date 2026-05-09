# MarketFlow BrokerSync Infrastructure

This folder is the backend foundation for real broker synchronization. It is intentionally separated from the React UI so the product does not fake broker connectivity.

## Current production contract

- `api/broker-sync.js` remains the single Vercel Function entrypoint.
- `server/broker-sync-core.js` is a compatibility facade that loads `server/broker-sync/handler.js`.
- `TradeSyncEngine` validates the scoped feed token, selects the broker adapter, normalizes payloads, deduplicates by ticket, inserts into `trades`, updates broker account health, and writes sync logs when the database table exists.
- MT4/MT5 support is modeled as a bridge/EA ingestion contract because MetaTrader does not provide a universal public REST API.

## Status truth

Broker accounts must not be marked live after a UI click. They move through real sync states:

- `waiting_for_payload`: feed created, waiting for bridge/API/import data.
- `syncing`: payload is being processed.
- `synced`: valid trades were inserted or already reconciled.
- `partially_synced`: some rows synced and some rows were rejected.
- `failed`: ingestion failed.
- `reconnect_required`, `expired`, `rate_limited`: provider attention required.

## Next backend milestones

- Implement the MT4/MT5 Expert Advisor bridge package.
- Add provider-specific Oanda, IBKR Flex, cTrader, DXTrade, TradeLocker and MatchTrader adapters.
- Move retry queue from lightweight function modules to a durable queue once the project is on infrastructure that supports workers.
- Attach import batches and rollback UI to the existing All Trades importer.
