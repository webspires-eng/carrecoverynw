# 02 — Redirect cleanup

## Problem

Search Console reported:
- 9 pages with status **"Page with redirect"** — Validation failed
- 1 page with status **"Redirect error"** (broken or looping)

These 10 pages aren't being indexed and waste crawl budget.

## What was built

| Layer | File | Purpose |
|---|---|---|
| Audit script | [scripts/auditRedirects.ts](../../scripts/auditRedirects.ts) | Paste failing URLs into `INPUT_URLS`, run, get a per-URL chain trace + classified issue list. |
| Sitemap verifier | [scripts/verifySitemap.ts](../../scripts/verifySitemap.ts) | Hits every `<loc>` in sitemap.xml with `redirect: 'manual'`. Exits non-zero if any URL isn't a clean 200. |
| Canonical-host redirect | [next.config.ts](../../next.config.ts) | Apex `cartowingnearme.co.uk` → `www.cartowingnearme.co.uk` in a single 301 (host-based `has` matcher). |
| Middleware guard | [middleware.js](../../middleware.js) | Refuses to emit a redirect whose target equals the current path — prevents accidental loops. |
| Weekly monitor | [src/app/api/cron/redirects/route.js](../../src/app/api/cron/redirects/route.js) | Fetches sitemap, hits every URL, logs anything not 200. Vercel cron schedule in [vercel.json](../../vercel.json). |

## Issue types the audit detects

- `CHAIN_TOO_LONG` — more than 1 redirect hop
- `LOOP` — same URL revisited
- `ENDS_IN_404` / `ENDS_IN_5XX` / `ENDS_IN_NON_2XX`
- `MIXED_HTTP_HTTPS` — protocol changes mid-chain
- `WWW_INCONSISTENCY` — same host but www flipping
- `MIXED_301_302` — combination of permanent and temporary in one chain
- `EMPTY_LOCATION` — 3xx with no `Location` header (almost always the cause of "Redirect error")
- `MAX_HOPS_EXCEEDED` — exceeded 10 hops, treat as loop

## How to use

### Get the URLs from Search Console

1. Search Console → Indexing → **Pages**
2. Scroll to "Why pages aren't indexed"
3. Click **"Page with redirect"** → Export → CSV. Repeat for **"Redirect error"**
4. Copy the `URL` column. Paste into `INPUT_URLS` in [scripts/auditRedirects.ts](../../scripts/auditRedirects.ts)
5. Run `npx tsx scripts/auditRedirects.ts`

### Read the report

`scripts/output/redirect-audit.json` is the machine-readable form. Console output is human-readable per-URL with a suggested fix.

## Fix templates

### Redirect chain (A→B→C, should be A→C)

```ts
async redirects() {
  return [
    // Both rules jump straight to the FINAL destination, never to each other:
    { source: '/old',    destination: '/final', permanent: true },
    { source: '/middle', destination: '/final', permanent: true },
  ];
}
```

### Redirect loop

Two common causes:
1. Two competing rules: X redirects `/foo` → `/bar` and Y redirects `/bar` → `/foo`. Pick one canonical, delete the other.
2. Middleware redirecting to itself. Use the guard pattern in [middleware.js](../../middleware.js):
   ```js
   const target = new URL('/signin', request.url);
   if (target.pathname !== pathname) {
       return NextResponse.redirect(target);
   }
   ```

### HTTP → HTTPS

Vercel handles this automatically when the domain is attached. Do **not** add an explicit HTTP→HTTPS rule in `next.config.ts` — it stacks on top of Vercel's edge redirect and creates a chain.

### www vs non-www

Already added to [next.config.ts](../../next.config.ts):

```ts
{
  source: '/:path*',
  has: [{ type: 'host', value: 'cartowingnearme.co.uk' }],
  destination: 'https://www.cartowingnearme.co.uk/:path*',
  permanent: true,
}
```

**⚠ Verify Vercel domain settings.** If Vercel is already redirecting apex→www at the edge, this app-level rule will create a *second* hop. Pick one place to do the redirect, not both.

### Sitemap pointing at redirecting URLs

[src/app/sitemap.xml/route.js](../../src/app/sitemap.xml/route.js) builds URLs from `getSiteUrl()` which always returns the canonical `https://www.…` host, so apex/HTTP entries don't leak in. Verify with:

```bash
npx tsx scripts/verifySitemap.ts
```

Exit code is non-zero if any URL is non-200, suitable for CI.

### "Redirect error" (empty Location)

A 3xx response with no `Location` header. The audit flags as `EMPTY_LOCATION`. Find the rule emitting it (often middleware with an undefined target). The middleware guard prevents this structurally.

## Validate fix in Search Console

After deploy:
1. Search Console → Pages → **"Page with redirect"** → click each URL → **Validate Fix**
2. Repeat for **"Redirect error"**
3. Google re-crawls within 1–2 weeks

## Ongoing monitoring

[src/app/api/cron/redirects/route.js](../../src/app/api/cron/redirects/route.js) runs weekly (Mondays 04:00 UTC) and logs any sitemap URL not returning 200. Authorised via `CRON_SECRET`.

## Status

- ✅ Tooling shipped, type-check clean
- ✅ Canonical host redirect in place
- ✅ Middleware guard added
- ✅ Weekly cron scheduled
- ⏳ **Cannot apply URL-specific fixes until the 10 failing URLs are exported and run through `auditRedirects.ts`** — the failing URLs aren't in the repo
