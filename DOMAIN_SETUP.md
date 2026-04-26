# MarketFlow Domain Setup

MarketFlow is currently a Create React App deployed on Vercel with serverless functions in `api/`.
It is not a Next.js project.

## Target Structure

- `marketflowjournal.com` -> public marketing site and public legal/resource pages.
- `www.marketflowjournal.com` -> permanent redirect to `marketflowjournal.com`.
- `app.marketflowjournal.com` -> logged-in journal, checkout returns, dashboard, broker sync and API examples.

## Vercel Project Domains

Add all three domains to the same Vercel project:

- `marketflowjournal.com`
- `www.marketflowjournal.com`
- `app.marketflowjournal.com`

## DNS Records

If DNS is managed outside Vercel, add these records at the DNS provider:

| Type | Name | Value |
|---|---|---|
| A | `@` | Keep the current Vercel apex value already working for `marketflowjournal.com`: `216.198.79.1`. If Vercel later asks for a different value, use the value shown in the Vercel Domains screen. |
| CNAME | `www` | `cname.vercel-dns.com` |
| CNAME | `app` | `cname.vercel-dns.com` |

If Vercel shows a project-specific CNAME target in the Domains screen, use that exact Vercel value instead of the generic CNAME above.

Do not add an `A` record for `app`; it should be a CNAME because it is a subdomain.

## Vercel Environment Variables

Set these in Vercel Production, then redeploy:

```env
REACT_APP_PUBLIC_SITE_URL=https://marketflowjournal.com
REACT_APP_APP_URL=https://app.marketflowjournal.com
NEXT_PUBLIC_SITE_URL=https://marketflowjournal.com
NEXT_PUBLIC_APP_URL=https://app.marketflowjournal.com
APP_URL=https://app.marketflowjournal.com
SUPPORT_EMAIL=support@marketflowjournal.com
```

`REACT_APP_*` values are compiled into the React build, so a redeploy is required after changing them.

## Required External App Settings

Supabase Auth redirect URLs:

- `https://app.marketflowjournal.com/auth/callback`
- `https://marketflowjournal.com/auth/callback`
- The existing Vercel preview URL patterns if you test previews.

Stripe Checkout and billing portal:

- No dashboard URL rewrite is needed if `NEXT_PUBLIC_APP_URL` is set in Vercel.
- Checkout success returns to `${NEXT_PUBLIC_APP_URL}/welcome`.
- Billing portal returns to `${NEXT_PUBLIC_APP_URL}/plan`.

## Verification

After DNS propagates:

- `https://marketflowjournal.com` loads the landing page.
- `https://www.marketflowjournal.com` redirects to `https://marketflowjournal.com`.
- `https://app.marketflowjournal.com/dashboard` loads the app entry and asks for login if needed.
- Pricing checkout returns to `https://app.marketflowjournal.com/welcome`.
- Broker/API snippets show `https://app.marketflowjournal.com/api/...`.
