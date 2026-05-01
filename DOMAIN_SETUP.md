# MarketFlow Domain Setup

MarketFlow is currently a Create React App deployed on Vercel with serverless functions in `api/`.
It is not a Next.js project.

## Current Safe Production Structure

- `marketflowjournal.com` -> active public site and journal fallback.
- `www.marketflowjournal.com` -> future official marketing site once DNS exists.
- `app.marketflowjournal.com` -> future connected journal workspace once DNS exists.

Important: `www.marketflowjournal.com` and `app.marketflowjournal.com` currently return DNS `NXDOMAIN` until records are created. Code cannot fix NXDOMAIN; DNS must be added first.

The deployment intentionally does not redirect `marketflowjournal.com` to `www.marketflowjournal.com` yet. Redirecting before `www` resolves would break the live site again.

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
6. Only then set the public/app domain values and app-domain flags, then redeploy:

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

After both subdomains are valid in Vercel, set the Vercel Domains preference so:

- `www.marketflowjournal.com` is the primary marketing domain.
- `app.marketflowjournal.com` is assigned to the same deployment and handled by app routing.
- `marketflowjournal.com` can redirect to `https://www.marketflowjournal.com` only after `www` is confirmed live.

## Verification

Before enabling app mode:

- `https://marketflowjournal.com` loads the landing page.
- `https://marketflowjournal.com/dashboard` can still load the journal fallback.
- `https://www.marketflowjournal.com` will not work until the `www` DNS record exists.
- `https://app.marketflowjournal.com` will not work until the `app` DNS record exists.

After DNS and flags are active:

- `https://www.marketflowjournal.com` loads the landing site.
- `https://app.marketflowjournal.com/dashboard` loads the app entry and asks for login if needed.
- Pricing checkout returns to `https://app.marketflowjournal.com/welcome`.
