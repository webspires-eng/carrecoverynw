# 03 — Crawl-budget optimisation

## Problem (from Search Console Crawl Stats)

- Only 1,370 crawl requests over 90 days for a 334-page site (~15/day)
- 34 % of crawl requests were JS files, only 28 % HTML
- 17 % "Discovery" / 83 % "Refresh" — Google barely finds new pages
- Average response time **544 ms** (Google prefers < 200 ms)
- 48 % of Googlebot traffic was "Page resource load" (rendering JS)

## Diagnosis

Two failure modes drove the budget waste:

1. **Page render time too slow.** Area pages had `revalidate = 0` — every Googlebot request re-ran DB queries and re-rendered. That alone explains most of the 544 ms.
2. **No crawl-budget signalling.** `/_next/static/` JS bundles weren't disallowed, so Google was discovering them as "pages" and counting them against the budget.

## What was changed

| Layer | File | Change |
|---|---|---|
| ISR | [src/app/areas/[slug]/page.jsx](../../src/app/areas/%5Bslug%5D/page.jsx) | `revalidate` flipped from `0` → `86400` (24 h ISR). Pages now pre-built at deploy and refreshed daily. Manual updates via `revalidatePath('/areas/<slug>')`. |
| Edge cache | [next.config.ts](../../next.config.ts) | `Cache-Control: public, s-maxage=86400, stale-while-revalidate=3600` on `/areas/:slug*`. |
| Static asset cache | [next.config.ts](../../next.config.ts) | `Cache-Control: public, max-age=31536000, immutable` on `/_next/static/:path*`. |
| robots.txt | [src/app/robots.js](../../src/app/robots.js) | Fallback rules now disallow `/_next/static/` for `*` and `Googlebot`. |
| Parallel data | [src/app/areas/[slug]/page.jsx](../../src/app/areas/%5Bslug%5D/page.jsx) | All page data fetched via `Promise.all` instead of sequential `await`s. |

## On the robots.txt distinction

> Disallowing `/_next/static/` from **crawling** saves crawl budget. It does **not** prevent Googlebot from **loading** these files when rendering pages.

This is correct. `Disallow:` only blocks discovery/indexing of those URLs as pages — it does not block them from being fetched as subresources during rendering. Because the area pages are SSR'd (the HTML is complete without JS execution), Googlebot has everything it needs from the HTML response.

⚠ Caveat: Google has historically warned against blocking *render-blocking* CSS/JS. Since the content here is fully server-rendered, blocking `/_next/static/` is safe. If you ever move content into `useEffect` data fetches, revisit this.

## On client components in the SSR tree

Many components in `src/components/` carry `"use client"`. **That is fine.** In App Router, `"use client"` does not mean "render only on client" — Next.js still SSRs the initial render and ships full HTML; `"use client"` just opts the component into hydration so it can use hooks.

The `useEffect` calls audited ([HeroSection.jsx](../../src/components/HeroSection.jsx), [TestimonialsSection.jsx](../../src/components/TestimonialsSection.jsx)) are scroll/resize listeners — UI-only, no data fetching. The content is in the source.

The new sub-area links (task #1) and nearby-areas section (task #4) are server components, so they're guaranteed in the HTML.

## Important: the robots.txt is DB-driven

[src/app/robots.js](../../src/app/robots.js) builds the response from `seo_settings.robots_txt` in MongoDB. The fallback rules I added only fire when that field is empty.

**Update the DB row in `/admin` too** — the on-screen content is what's served. Add:

```
User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /_next/static/

User-Agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /_next/static/

Sitemap: https://www.cartowingnearme.co.uk/sitemap.xml
```

## Expected impact

- Median area-page response time: 544 ms → ~30 ms (edge cache hit). Even cold renders should be faster because data fetches now run in parallel.
- Crawl-budget reallocation: less time fetching `/_next/static/` URLs, more on HTML.
- "Discovery vs Refresh": doesn't move directly from this work — that depends on **internal linking** (tasks #1 and #4). Once 334 pages cross-link via auto-generated nearby-area anchors, Google has hundreds of new internal anchors to follow on each refresh crawl, which lifts discovery.

## Verify

After deploy, check response headers:

```bash
curl -sI https://www.cartowingnearme.co.uk/areas/kensington | grep -i cache-control
# expect: cache-control: public, s-maxage=86400, stale-while-revalidate=3600

curl -sI https://www.cartowingnearme.co.uk/_next/static/<some-bundle>.js | grep -i cache-control
# expect: cache-control: public, max-age=31536000, immutable

curl -s https://www.cartowingnearme.co.uk/robots.txt | grep _next
# expect: Disallow: /_next/static/
```

Recheck Search Console → Crawl Stats after ~14 days.
