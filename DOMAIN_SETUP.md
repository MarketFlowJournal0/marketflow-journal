# MarketFlow Domain Setup

MarketFlow is currently a Create React App deployed on Vercel with serverless functions in `api/`.
It is not a Next.js project.

## Target Structure

- `www.marketflowjournal.com` -> public marketing site, pricing, resources, documentation, legal pages, and support.
- `marketflowjournal.com` -> redirects public marketing pages to `www.marketflowjournal.com`.
- `app.marketflowjournal.com` -> connected journal workspace, dashboard, checkout returns, broker sync, and API examples.

The app domain is feature-flagged to avoid sending users to a DNS target that is not ready yet.

## Vercel Project Domains

Add all three domains to the same Vercel project:

- `marketflowjournal.com`
- `www.marketflowjournal.com`
- `app.marketflowjournal.com`

## DNS Records

If DNS is managed outside Vercel, add these records at the DNS provider:

| Type | Name | Value |
|---|---|---|
| A | `@` | `216.198.79.1` unless Vercel shows a different apex value |
| CNAME | `www` | `cname.vercel-dns.com` |
| CNAME | `app` | `cname.vercel-dns.com` |

If Vercel shows a project-specific CNAME target in the Domains screen, use that exact Vercel value instead of the generic CNAME above.

Do not add an `A` record for `app`; it should be a CNAME because it is a subdomain.

## Safe Activation Order

1. Add `app.marketflowjournal.com` to the Vercel project domains.
2. Add the DNS `CNAME app -> cname.vercel-dns.com`.
3. Wait until `app.marketflowjournal.com` resolves and Vercel marks it as valid.
4. Add Supabase redirect URLs listed below.
5. Set `REACT_APP_ENABLE_APP_DOMAIN=true` and `ENABLE_APP_DOMAIN=true` in Vercel Production.
6. Redeploy.

Until step 5 is done, MarketFlow keeps journal links on the public domain so users do not hit "site inaccessible".

## Vercel Environment Variables

Use this production configuration after DNS is ready:

```env
REACT_APP_PUBLIC_SITE_URL=https://www.marketflowjournal.com
REACT_APP_APP_URL=https://app.marketflowjournal.com
REACT_APP_ENABLE_APP_DOMAIN=true
NEXT_PUBLIC_SITE_URL=https://www.marketflowjournal.com
NEXT_PUBLIC_APP_URL=https://app.marketflowjournal.com
APP_URL=https://app.marketflowjournal.com
ENABLE_APP_DOMAIN=true
SUPPORT_EMAIL=support@marketflowjournal.com
```

Before DNS is ready, keep both app-domain flags set to `false`.

`REACT_APP_*` values are compiled into the React build, so a redeploy is required after changing them.

## Required External App Settings

Supabase Auth redirect URLs:

- `https://app.marketflowjournal.com/auth/callback`
- `https://www.marketflowjournal.com/auth/callback`
- `https://marketflowjournal.com/auth/callback`
- The existing Vercel preview URL patterns if you test previews.

Stripe Checkout and billing portal:

- Checkout success returns to `${APP_URL}/welcome` only when `ENABLE_APP_DOMAIN=true`.
- Billing portal returns to `${APP_URL}/plan` only when `ENABLE_APP_DOMAIN=true`.
- Before activation, these return to `https://www.marketflowjournal.com` to avoid a dead app subdomain.

## Verification

After DNS propagates and app-domain flags are enabled:

- `https://www.marketflowjournal.com` loads the landing page.
- `https://marketflowjournal.com` redirects marketing pages to `https://www.marketflowjournal.com`.
- `https://app.marketflowjournal.com/dashboard` loads the app entry and asks for login if needed.
- Pricing checkout returns to `https://app.marketflowjournal.com/welcome`.
- Broker/API snippets show `https://app.marketflowjournal.com/api/...`.
