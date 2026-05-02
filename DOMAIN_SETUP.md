# MarketFlow Domain Setup

MarketFlow is a Create React App deployed on Vercel with serverless functions in `api/`.
It is not a Next.js project.

## Target Structure

- `https://www.marketflowjournal.com` is the public marketing site.
- `https://app.marketflowjournal.com` is the connected journal workspace.
- `https://marketflowjournal.com` should stay attached to Vercel as the apex fallback, then redirect to `www` only after `www` is valid.

Important: code cannot fix `DNS_PROBE_FINISHED_NXDOMAIN`. If `www` or `app` does not resolve, the DNS records below are missing or not propagated yet.

## DNS Records To Add

Add these records at the DNS provider that manages `marketflowjournal.com`:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `216.198.79.1` |
| CNAME | `www` | `cname.vercel-dns.com` |
| CNAME | `app` | `cname.vercel-dns.com` |

If Vercel shows a project-specific CNAME target in Project Settings > Domains, use that exact Vercel value instead of the generic CNAME above.

Do not add `A` records for `www` or `app`; both should be CNAME records.

## Vercel Domains

Add all three domains to the same MarketFlow Vercel project:

- `marketflowjournal.com`
- `www.marketflowjournal.com`
- `app.marketflowjournal.com`

Once DNS is valid, make `www.marketflowjournal.com` the primary public domain. Keep `app.marketflowjournal.com` attached to the same deployment for the workspace.

## Production Environment Variables

Use these values in Vercel Production:

```env
REACT_APP_PUBLIC_SITE_URL=https://www.marketflowjournal.com
REACT_APP_APP_URL=https://app.marketflowjournal.com
REACT_APP_ENABLE_APP_DOMAIN=auto
NEXT_PUBLIC_SITE_URL=https://www.marketflowjournal.com
NEXT_PUBLIC_APP_URL=https://app.marketflowjournal.com
APP_URL=https://app.marketflowjournal.com
ENABLE_APP_DOMAIN=auto
SUPPORT_EMAIL=support@marketflowjournal.com
```

`auto` keeps localhost and Vercel preview deployments safe while enabling the split on the real production domains.

## Supabase Redirect URLs

Add these URLs to Supabase Auth redirect settings:

- `https://www.marketflowjournal.com/auth/callback`
- `https://app.marketflowjournal.com/auth/callback`
- `https://marketflowjournal.com/auth/callback`

## Expected Verification

- `https://www.marketflowjournal.com` loads the landing page.
- `https://app.marketflowjournal.com/dashboard` opens the journal entry and asks for login if needed.
- `https://app.marketflowjournal.com/broker-connect` opens Broker Connect after login.
- Stripe Checkout returns to `https://app.marketflowjournal.com/welcome`.
- Emails link back to `https://app.marketflowjournal.com/dashboard`.
