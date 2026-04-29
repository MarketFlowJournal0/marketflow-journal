# MarketFlow Domain Setup

MarketFlow is currently a Create React App deployed on Vercel with serverless functions in `api/`.
It is not a Next.js project.

## Current Safe Production Structure

- `marketflowjournal.com` -> active public site and journal fallback.
- `www.marketflowjournal.com` -> should redirect to `marketflowjournal.com` once the DNS record exists.
- `app.marketflowjournal.com` -> future connected journal workspace, enabled only after DNS is valid.

Important: `www.marketflowjournal.com` and `app.marketflowjournal.com` currently return DNS `NXDOMAIN` until records are created. Code cannot fix NXDOMAIN; DNS must be added first.

## DNS Records To Add

DNS appears to be managed at OVH. Add these records:

| Type | Name | Value |
|---|---|---|
| A | `@` | `216.198.79.1` |
| CNAME | `www` | `cname.vercel-dns.com` |
| CNAME | `app` | `cname.vercel-dns.com` |

If Vercel shows a project-specific CNAME target in the Domains screen, use that exact Vercel value instead of the generic CNAME above.

Do not add an `A` record for `www` or `app`; both should be CNAME records.

## Safe Activation Order

1. Keep production running on `https://marketflowjournal.com`.
2. Add `www.marketflowjournal.com` and `app.marketflowjournal.com` to the same Vercel project.
3. Add the OVH DNS records above.
4. Wait until both subdomains resolve and Vercel marks them valid.
5. Add Supabase redirect URLs:
   - `https://marketflowjournal.com/auth/callback`
   - `https://www.marketflowjournal.com/auth/callback`
   - `https://app.marketflowjournal.com/auth/callback`
6. Only then set app-domain flags to true and redeploy:

```env
REACT_APP_PUBLIC_SITE_URL=https://marketflowjournal.com
REACT_APP_APP_URL=https://app.marketflowjournal.com
REACT_APP_ENABLE_APP_DOMAIN=true
NEXT_PUBLIC_SITE_URL=https://marketflowjournal.com
NEXT_PUBLIC_APP_URL=https://app.marketflowjournal.com
APP_URL=https://app.marketflowjournal.com
ENABLE_APP_DOMAIN=true
SUPPORT_EMAIL=support@marketflowjournal.com
```

Before DNS is ready, keep both app-domain flags set to `false`.

## Verification

Before enabling app mode:

- `https://marketflowjournal.com` loads the landing page.
- `https://marketflowjournal.com/dashboard` can still load the journal fallback.
- `https://www.marketflowjournal.com` will not work until the `www` DNS record exists.
- `https://app.marketflowjournal.com` will not work until the `app` DNS record exists.

After DNS and flags are active:

- `https://www.marketflowjournal.com` redirects to `https://marketflowjournal.com`.
- `https://app.marketflowjournal.com/dashboard` loads the app entry and asks for login if needed.
- Pricing checkout returns to `https://app.marketflowjournal.com/welcome`.
