# MarketFlow Domain Setup

MarketFlow is a Create React App deployed on Vercel with serverless functions in `api/`.
It is not a Next.js project.

## Target Structure

- `https://www.marketflowjournal.com` is the public marketing site and primary domain.
- `https://marketflowjournal.com` redirects permanently to `https://www.marketflowjournal.com`.
- `https://app.marketflowjournal.com` is the connected journal workspace and must not redirect to the public site.

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

- `www.marketflowjournal.com` as the primary production domain.
- `marketflowjournal.com` attached with a Vercel redirect to `www.marketflowjournal.com`.
- `app.marketflowjournal.com` attached as a production domain with no redirect.

The code decides what to render from the hostname:

- Hostnames starting with `app.` render only the connected journal product.
- `localhost`, `127.0.0.1`, and Vercel preview hosts render the app for development/testing.
- Every other hostname renders only the marketing site.

## Production Environment Variables

```env
REACT_APP_SITE_URL=https://www.marketflowjournal.com
REACT_APP_PUBLIC_SITE_URL=https://www.marketflowjournal.com
REACT_APP_APP_URL=https://app.marketflowjournal.com
NEXT_PUBLIC_SITE_URL=https://www.marketflowjournal.com
PUBLIC_SITE_URL=https://www.marketflowjournal.com
NEXT_PUBLIC_APP_URL=https://app.marketflowjournal.com
APP_URL=https://app.marketflowjournal.com
REACT_APP_ENABLE_APP_DOMAIN=true
ENABLE_APP_DOMAIN=true
SUPPORT_EMAIL=support@marketflowjournal.com
```

## Supabase Redirect URLs

Add these URLs to Supabase Auth redirect settings:

- `https://app.marketflowjournal.com/auth/callback`
- `http://localhost:3000/auth/callback`

## Expected Verification

- `https://www.marketflowjournal.com` loads only the landing page, even for a signed-in user.
- `https://marketflowjournal.com` redirects to `https://www.marketflowjournal.com`.
- `https://app.marketflowjournal.com/dashboard` opens the journal workspace and asks for login if needed.
- `https://app.marketflowjournal.com/broker-connect` opens Broker Connect after login.
- Stripe Checkout returns to `https://app.marketflowjournal.com/welcome`.
- Emails link back to `https://app.marketflowjournal.com/dashboard`.
