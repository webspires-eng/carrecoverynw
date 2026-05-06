# 05 — Redirect fixes applied (post-audit)

Run on: 10 URLs from Search Console "Page with redirect" + "Redirect error" exports.

## Audit output

| URL | Chain | Hops | Status |
|---|---|---:|---|
| `https://cartowingnearme.co.uk/area/london-borough-of-lambeth` | 301 → www/area/… → 308 → /areas/… → 200 | 2 | ❌ FIX |
| `https://cartowingnearme.co.uk/areas/braintree` | 301 → www/areas/braintree → 200 | 1 | ✅ OK |
| `https://www.cartowingnearme.co.uk/area/ashford` | 308 → /areas/ashford → 200 | 1 | ✅ OK |
| `https://www.cartowingnearme.co.uk/area/barnstaple` | 308 → /areas/barnstaple → 200 | 1 | ✅ OK |
| `http://www.cartowingnearme.co.uk/` | 308 → https://www/ → 200 | 1 | ✅ OK (Vercel HTTPS upgrade) |
| `https://cartowingnearme.co.uk/area/aylesbury` | 301 → www/area/… → 308 → /areas/… → 200 | 2 | ❌ FIX |
| `https://www.cartowingnearme.co.uk/area/aylesbury` | 308 → /areas/aylesbury → 200 | 1 | ✅ OK |
| `http://cartowingnearme.co.uk/` | 308 → https://apex/ → 301 → www/ → 200 | 2 | ⚠ Vercel-side |
| `https://cartowingnearme.co.uk/` | 301 → www/ → 200 | 1 | ✅ OK |
| `https://cartowingnearme.co.uk/areas/buxton` | 301 → www/areas/buxton → 200 | 1 | ✅ OK |

## Diagnosis

Two real problems and one Vercel-side problem.

### Problem A — apex `/area/*` chains via two hops

When a request hits `https://cartowingnearme.co.uk/area/aylesbury`:
1. The generic `apex → www` rule fires → 301 to `https://www.cartowingnearme.co.uk/area/aylesbury`
2. The same-host `/area/:path*` → `/areas/:path*` rule fires → 308 to `/areas/aylesbury`

Two redirects when one would do.

**Affected URLs:** `apex/area/london-borough-of-lambeth`, `apex/area/aylesbury` (and any other `apex/area/*` URL Google may still know about).

### Problem B — http://apex/ 2-hop chain

`http://cartowingnearme.co.uk/` → 308 (Vercel http→https edge upgrade) → `https://cartowingnearme.co.uk/` → 301 (our `next.config.ts` apex→www rule) → `https://www.cartowingnearme.co.uk/`.

**Cannot be fixed in `next.config.ts`** — Next's `redirects()` `has` matcher supports `header`, `cookie`, `host`, `query`. There's no protocol matcher, so we can't catch `http://apex` and redirect it directly to `https://www` from inside the app. The HTTPS upgrade always happens at Vercel's edge before our app runs.

### What's already fine

- `apex/areas/<slug>` → `www/areas/<slug>` is a single 301. This is the canonical-host enforcement working correctly. Search Console flagging it as "Page with redirect" is expected behaviour for the apex variant of indexed URLs — Google will eventually drop the apex from its index and only show the www form.
- `www/area/<slug>` → `/areas/<slug>` is a single 308. Existing same-host content move, no change needed.
- `http://www/` → `https://www/` is a single 308. That's Vercel's HTTPS upgrade, normal.

## Code change applied

[next.config.ts](../../next.config.ts) — added two more-specific rules **before** the generic apex→www rule, so they short-circuit it for `/area*` paths:

```ts
async redirects() {
  return [
    // Apex + /area* → www + /areas* in ONE 301 (avoids the two-hop chain).
    {
      source: '/area',
      has: [{ type: 'host', value: 'cartowingnearme.co.uk' }],
      destination: 'https://www.cartowingnearme.co.uk/areas',
      permanent: true,
    },
    {
      source: '/area/:path*',
      has: [{ type: 'host', value: 'cartowingnearme.co.uk' }],
      destination: 'https://www.cartowingnearme.co.uk/areas/:path*',
      permanent: true,
    },
    // Generic apex → www for everything else.
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'cartowingnearme.co.uk' }],
      destination: 'https://www.cartowingnearme.co.uk/:path*',
      permanent: true,
    },
    // Same-host moves (fire only when already on www).
    { source: '/index.php',     destination: '/',                  permanent: true },
    { source: '/area',          destination: '/areas',             permanent: true },
    { source: '/area/:path*',   destination: '/areas/:path*',      permanent: true },
  ];
}
```

After deploy, the chains for the 2 affected URLs become:

```
apex/area/aylesbury                  → 301 → https://www/areas/aylesbury → 200    (1 hop)
apex/area/london-borough-of-lambeth  → 301 → https://www/areas/…         → 200    (1 hop)
```

## Vercel-side action items (cannot fix in code)

Open Vercel → project → Settings → Domains and verify:

1. **Primary domain is `www.cartowingnearme.co.uk`** (not the apex).
2. **`cartowingnearme.co.uk` is configured to redirect to `www.cartowingnearme.co.uk`** at the edge.
3. **HTTPS is enforced** for both. Vercel does this automatically when DNS is correct.

If Vercel's apex domain is set up to redirect to www at edge, the `http://apex/` chain collapses to a single hop:

```
http://apex/  → 301 (Vercel edge) → https://www/   (1 hop)
```

**⚠ If Vercel is doing apex→www at the edge, you MUST remove the `/:path*` apex→www rule from `next.config.ts`** — otherwise both redirects fire and stack:

```
http://apex/ → https://apex/ → https://www/ → https://www/   (still 2 hops, just in a different order)
```

The two specific `/area*` apex rules can stay either way (they're benign because they target the final destination directly).

### Decision tree

- **If Vercel currently does NOT redirect apex→www at edge** (i.e. only does http→https upgrade): keep `next.config.ts` as-is. The http://apex/ 2-hop chain is unavoidable from code, but it only affects the homepage and Google tolerates 1–2 hops.
- **If Vercel DOES redirect apex→www at edge**: delete the `/:path*` apex→www rule from `next.config.ts`, keep the two `/area*` rules. Otherwise you get a stacked chain.

To check what Vercel is doing, after deploy:

```bash
curl -sI http://cartowingnearme.co.uk/ | grep -iE 'location|HTTP'
# If you see ONE redirect to https://www/ → Vercel is doing both, remove our rule.
# If you see ONE redirect to https://apex/ → Vercel only does HTTPS, keep our rule.
```

## Verification

Sitemap is clean as of audit run:

```
$ npx tsx scripts/verifySitemap.ts
Loading sitemap: https://www.cartowingnearme.co.uk/sitemap.xml
Found 338 URLs. Checking with concurrency=8 ...
All 338 sitemap URLs return 200.
```

Exit code 0. ✅

## Search Console follow-up

After deploy:

1. **Search Console → Indexing → Pages → "Page with redirect"** — click each of the 9 affected URLs → click **Validate Fix**.
2. **Search Console → Indexing → Pages → "Redirect error"** — click the 1 affected URL → click **Validate Fix**.
3. Google will re-crawl within 1–2 weeks and update the status.

For the URLs that the audit flagged as "OK" (already a single hop): those were probably reported by Google before the canonical-host redirect was deployed in the previous SEO pass. Validating them in Search Console will clear them — no further code change needed.

## Files changed

- [next.config.ts](../../next.config.ts) — two new specific apex+/area* rules added before the generic apex→www rule
- [scripts/auditRedirects.ts](../../scripts/auditRedirects.ts) — `INPUT_URLS` populated with the 10 audited URLs (kept for re-runs / reference)
