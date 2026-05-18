# MarketFlow Journal - V1 Readiness Audit

Last updated: 2026-05-18

## Executive Summary

MarketFlow is becoming a real SaaS, but it must be split clearly between what is already productized and what still needs dedicated backend/provider infrastructure.

The current app has a strong frontend workspace, Stripe subscription flow, Supabase auth/data storage, import tooling, analytics surfaces, dashboard modules, support UI, security headers/rate limiting, and plan-gated access. The critical gaps are not visual polish anymore. They are provider infrastructure, email deliverability, Supabase migrations applied consistently, true broker adapters, true trade copier execution infrastructure, and production observability.

Important principle: 100% secure does not exist. The production goal is to remove critical weaknesses, harden the architecture, verify each flow, and keep auditing continuously.

## What Works Today

- Auth is based on Supabase sessions.
- Subscription access is based on Stripe-synced profile status.
- Journal access is allowed only for `trialing` and `active` statuses.
- Journal access is blocked for failed or inactive statuses such as `past_due`, `unpaid`, `canceled`, `incomplete`, and `incomplete_expired`.
- The 14-day trial now opens the Elite interface while preserving the selected billing plan after the trial.
- Stripe Checkout creates subscription sessions with card collection and one-trial-per-account logic.
- Stripe webhooks update profile subscription status after checkout, subscription updates, deletes, payment success, and payment failure.
- All Trades is the central data surface for manual/imported trades.
- Dashboard, calendar, analytics, equity, psychology, reports, alerts, and account surfaces consume journal data at different levels.
- Security hardening exists for API CORS, rate limiting, blocked abusive user agents, and sourcemap control.
- Support now has a database-backed ticket fallback instead of relying only on email delivery.

## Critical External Configuration Still Required

- `support@marketflowjournal.com` must exist as a real mailbox or alias at the mail provider.
- Resend must verify `marketflowjournal.com` before it can reliably send from `support@marketflowjournal.com`.
- DNS must include the exact SPF/DKIM records provided by Resend. The domain currently shows OVH mail records, but not Resend authorization.
- The Supabase SQL migration `supabase/support_requests.sql` must be executed in the production Supabase SQL editor.
- Stripe production price IDs must be correct in Vercel env vars, especially annual Pro.
- Stripe webhook endpoint must be active in production and signed with the production `STRIPE_WEBHOOK_SECRET`.
- `GENERATE_SOURCEMAP=false` must remain set in Vercel production env.
- Upstash/Redis env vars should be configured if durable cross-instance rate limiting is required.

## Support System

Current issue: direct email to `support@marketflowjournal.com` can bounce because mail routing/domain authentication is not fully configured.

Code-level fix implemented:

- `/api/support` creates a `support_requests` ticket in Supabase first.
- It then attempts Resend email delivery.
- If Resend fails but the ticket was saved, the API returns success with `queued: true`.
- The Support Center UI now tells the user the request is safely stored instead of showing a dead-end error.

Required production setup:

- Create mailbox or alias: `support@marketflowjournal.com`.
- In Resend, verify `marketflowjournal.com`.
- Add the exact DNS records from Resend for SPF/DKIM/domain verification.
- Set Vercel env vars:
  - `SUPPORT_EMAIL=support@marketflowjournal.com`
  - `SUPPORT_TO_EMAIL=support@marketflowjournal.com`
  - `SUPPORT_FROM_EMAIL=support@marketflowjournal.com`
  - `RESEND_API_KEY=...`

## Subscription And Access Rules

Expected behavior:

- New user chooses a plan.
- User completes onboarding.
- User starts Stripe Checkout with card.
- During the 14-day trial, the user receives Elite interface access.
- After 14 days, Stripe charges the originally selected plan.
- If payment succeeds, the user keeps access on the selected plan.
- If payment fails, the app blocks journal access and sends the user to plan/payment recovery.
- User data remains stored even when access is blocked.

Current implementation:

- `trialing` and unexpired trial = access allowed.
- `active` = access allowed.
- `past_due`, `unpaid`, `canceled`, `incomplete`, `incomplete_expired` = access blocked.
- Trial interface is now Elite.
- Billing plan remains the selected plan.

## Journal UX Simplification Recommendation

The journal should stay professional and dense only where data requires it. The next UI cleanup should follow this hierarchy:

- Dashboard: daily state, account scope, calendar, core metrics, workflow notification, and one clear next action.
- All Trades: table-first, fastest import/edit/delete flow, no dashboard duplication.
- Analytics: reusable charts only, each tied to All Trades.
- Elite Analytics: every dimension from All Trades, including hour, weekday, week of month, day of month, symbol, setup, account, broker, session, tag, emotion, RR, SL/TP outcome, fees, and drawdown.
- Psychology: daily questionnaire, behavior trend, trading state, discipline score, correlation with outcomes.
- Backtest: split into replay workspace and backtest analytics.
- BrokerConnect: connection/import wizard first, infrastructure truth second, no fake "connected" state without real data ingestion.

## BrokerConnect Reality Check

Supporting 400+ brokers is not a single API feature. It requires multiple integration classes.

Recommended broker architecture:

- Native API/OAuth adapters for providers that expose APIs.
- File parsers for brokers/platforms that only export statements.
- MT4/MT5 EA bridge for live MetaTrader sync.
- Queue-based sync engine for retries and reconciliation.
- Normalization engine for symbols, timezones, fees, swaps, partial closes, accounts, prop firms, and duplicate detection.
- Audit logs for every import and sync action.

Provider categories:

- Native/API candidates: Oanda, Interactive Brokers, Tradovate, Binance, Bybit, Coinbase, cTrader Open API, Tradier, selected crypto exchanges.
- File/import-first candidates: MT4/MT5 statements, FXBlue exports, TradeLocker, DXTrade, MatchTrader, NinjaTrader, cTrader exports.
- EA/bridge candidates: MT4 and MT5 live sync.
- Prop firms: most are not brokers. They usually run on MT4, MT5, cTrader, DXTrade, MatchTrader, TradeLocker, Tradovate, or Rithmic.

Current risk:

- The UI can look connected before a real account/trade ingestion pipeline confirms data. That must be avoided. A broker is only connected when at least account identity, last sync, sync method, and a verified import/live trade payload exist.

## Elite Trade Copier Reality Check

A true trade copier cannot be safely implemented as a React-only feature.

Required infrastructure:

- MT4/MT5 EA or desktop/VPS bridge for execution.
- Broker API integration where brokers support execution APIs.
- Master/follower account model.
- Risk allocation rules per follower.
- Max daily loss, max total loss, prop firm guardrails, symbol mapping, lot-size rounding, and emergency kill switch.
- Execution audit log.
- Latency and retry policy.
- Duplicate order protection.
- Fail-safe mode if bridge disconnects.

Current MarketFlow should describe this as Elite copier infrastructure/workspace until real execution adapters are in production.

## Backtest Requirements

Backtest should be two pages:

- Replay workspace: chart, symbol, date, timeframe, play/pause, candle-by-candle replay, trade placement, SL/TP, RR, save to All Trades.
- Backtest analytics: session history, hourly performance, weekday, week of month, best/worst sessions, symbol edge, setup edge, RR distribution, drawdown, winrate, psychology correlation where relevant.

Data providers required:

- A historical OHLC provider with licensing that allows app usage.
- Provider abstraction for future sources.
- Cache layer to avoid rate limits and slow loading.

Do not promise full TradingView replay unless the integration is licensed and stable.

## Security Status

Already improved:

- API CORS restrictions.
- API rate limiting by IP/user/category.
- Security headers in Vercel config.
- Sourcemap policy prepared.
- Sensitive Stripe fields sanitized from profile responses in API helpers.

Still required before production:

- Re-run Supabase RLS audit after every table migration.
- Confirm anonymous cannot read `profiles`, `trades`, `support_requests`, broker accounts, or subscription data.
- Move all Stripe-sensitive fields to backend-only access when possible.
- Add captcha or invite controls if signup abuse starts.
- Add centralized logging/monitoring.
- Add alerting for webhook failures, support email failures, broker sync failures, and import spikes.

## V1 Production Priority

1. Run `supabase/support_requests.sql` in production Supabase.
2. Fix support email DNS and Resend verification.
3. Verify Stripe annual/monthly price IDs in Vercel production env.
4. Test new signup -> onboarding -> plan -> Stripe -> welcome -> journal access.
5. Test existing trialing user -> direct journal access with Elite interface.
6. Test failed payment -> access blocked, data preserved.
7. Audit all broker states so no connection says "synced" without real account/trade data.
8. Simplify dashboard and BrokerConnect UI around real states only.
9. Split Backtest into replay and analytics.
10. Start mobile app planning only after auth/subscription/support/backtest/broker states are stable.
