# 04 — Publish-time linking pipeline

## Problem

When a new area page was published, nothing happened automatically:
- The new page had no inbound links from existing pages
- Existing pages mentioning the new area in `nearby_areas` were plain text
- The new page's own `nearby_areas` were plain text
- Google had no path to discover the new page through crawling

## What was built

### Database fields (snake_case, matches existing schema)

Added by [scripts/migrate-internal-linking.mjs](../../scripts/migrate-internal-linking.mjs):

| Field | Type | Default | Purpose |
|---|---|---|---|
| `nearby_areas_slugs` | `string[]` | `[]` | Auto-calculated 6 nearest active areas (Haversine) |
| `internal_links_from` | `string[]` | `[]` | Slugs of pages whose plain-text content mentions this area |
| `linked_in_content` | `boolean` | `false` | Whether sub-areas/rich text has been processed for links |

Indexes added: `slug` (unique), `is_active`, `internal_links_from`.

The migration is idempotent — safe to re-run.

### Core engine — [src/lib/internalLinking.ts](../../src/lib/internalLinking.ts)

| Function | Returns | Purpose |
|---|---|---|
| `haversineKm(lat1, lng1, lat2, lng2)` | `number` | Great-circle distance |
| `calculateNearestAreas(slug)` | `Promise<AreaLink[]>` | 6 nearest active areas, excluding self and geo-less |
| `generateNearbyAreasHTML(items, name)` | `string` | Escaped HTML preview string |
| `injectLinksIntoSubAreasSection(area, slugMap)` | `string` | Wraps matching names in `<a>` tags using [slugMatcher](../../src/lib/slugMatcher.ts) for normalisation |
| `reverseLink_UpdateExistingPages(slug, name, lat, lng)` | `Promise<UpdateResult>` | Within 25 km, swaps in the new area as a closer 6th neighbour where applicable; tracks inbound mentions |
| `triggerISRRevalidation(slugs)` | `Promise<void>` | `revalidatePath` in batches of 10, plus `/areas` and `/` |
| `buildSlugMap()`, `getInboundLinkCount(slug)` | helpers | For previews / status badges |

### Publish hook — [src/app/api/areas/publish/route.js](../../src/app/api/areas/publish/route.js)

`POST /api/areas/publish` with body `{ slug }`. Pipeline (each step in `try/catch` — failures don't abort):

1. Fetch the area, verify it has `latitude`/`longitude`
2. `calculateNearestAreas(slug)`
3. Store `nearby_areas_slugs` on the area
4. `injectLinksIntoSubAreasSection` → set `linked_in_content`
5. `generateNearbyAreasHTML` (returned to caller for preview)
6. `reverseLink_UpdateExistingPages` — neighbours within 25 km
7. `triggerISRRevalidation` — new page + every updated neighbour
8. Submit URLs via existing `submitAndTrack` (Google Indexing API)
9. `revalidatePath('/sitemap.xml')`
10. `logActivity('area_publish', …)` and respond

Auth: requires `admin_session` cookie. `maxDuration = 30s`, well inside the 10s response-time target.

### Public page render

[src/components/NearbyAreasSection.jsx](../../src/components/NearbyAreasSection.jsx) — server component. Reads `area.nearby_areas_slugs`, fetches each slug's `name`/`county`, renders `<Link>` cards. Wired into [src/app/areas/[slug]/page.jsx](../../src/app/areas/%5Bslug%5D/page.jsx) right after `CoverageSection`.

Fully SSR'd — no `useEffect`, anchors guaranteed in raw HTML.

### Admin tooling

| File | Purpose |
|---|---|
| [src/app/api/admin/internal-links/preview/route.js](../../src/app/api/admin/internal-links/preview/route.js) | `GET ?slug=…` or `?lat=…&lng=…` → `{ nearest, reverseTargets }`. Read-only preview of what the publish pipeline will do. |
| [src/components/admin/NearbyAreasPreview.jsx](../../src/components/admin/NearbyAreasPreview.jsx) | Drop-in client component for the Add/Edit area forms. Auto-refreshes (debounced 400 ms) when lat/lng change. |
| `LinkStatusBadge` (same file) | Drop-in badge for the areas list. Green = 6 outbound + ≥3 inbound; yellow = some links; red = none. |
| [src/lib/internalLinkingStatus.ts](../../src/lib/internalLinkingStatus.ts) | `classifyLinkStatus(outbound, inbound)` for SSR badge rendering. |

## How a publish flows end-to-end

```
Admin clicks Publish
  → existing PUT to /api/areas/[id] flips is_active=true
  → admin client calls POST /api/areas/publish { slug }
       → calculateNearestAreas → store outbound slugs
       → reverseLink_UpdateExistingPages → update neighbours
       → triggerISRRevalidation([new, ...neighbours, /areas, /])
       → submitAndTrack URLs to Google Indexing API
       → revalidatePath /sitemap.xml
  → response: { newPage, updatedPages, errors }
```

The new page now has 6 outbound links + N inbound links, every neighbour within 25 km has a fresh static build pointing at the new page, and Google has been pinged.

## Wire-up steps still required

1. **Hook the publish endpoint.** In your existing area save flow ([src/app/api/areas/[id]/route.js](../../src/app/api/areas/%5Bid%5D/route.js)), after a `PUT` that sets `is_active = true`, call `POST /api/areas/publish` with the slug. Not auto-wired because your current PUT mixes save+publish — decide whether *every save* runs the pipeline or only state transitions.
2. **Drop the preview into admin forms.** In [src/app/admin/areas/add/page.jsx](../../src/app/admin/areas/add/page.jsx) and [src/app/admin/areas/[id]/edit/page.jsx](../../src/app/admin/areas/%5Bid%5D/edit/page.jsx), import `NearbyAreasPreview` and render `<NearbyAreasPreview slug={slug} lat={Number(latitude)} lng={Number(longitude)} />` next to the lat/lng inputs.
3. **Drop the badge into the areas list.** In [src/app/admin/areas/page.jsx](../../src/app/admin/areas/page.jsx), per row pass `outbound = area.nearby_areas_slugs?.length ?? 0` and `inbound` (extend the GET endpoint to compute this, or use `getInboundLinkCount`).

## Caveats

- **Reverse-link logic only updates neighbours within 25 km that have `latitude` and `longitude`.** Geo-less areas are returned in `skippedPages`. Backfill geo on those before publishing nearby pages, or they'll never gain inbound links. Use [scripts/backfill-area-geo.mjs](../../scripts/backfill-area-geo.mjs).
- **The 6th-nearest swap is destructive.** If a neighbour's existing 6th-nearest was set manually, the pipeline will overwrite it. To preserve manual overrides, add a `nearby_areas_slugs_locked: true` flag and skip those documents in `reverseLink_UpdateExistingPages`.
- **`revalidatePath` only works inside server requests.** Calling the publish endpoint from the admin browser → API route is fine. Don't try invoking `triggerISRRevalidation` from a CLI script — Next.js will silently no-op.
- **No integration tests yet.** The slug matcher this depends on has 18 passing unit tests, but the engine is DB-bound and untested. Worth adding a seeded test before you trust this in production.

## Spec drift

The original spec assumed Prisma + camelCase + a separate `subAreas` field. Codebase reality: MongoDB, snake_case (`nearby_areas`, `is_active`, `latitude`, `longitude`), no separate `subAreas`. I matched the codebase. For Postgres + Prisma in future:

```prisma
model Area {
  nearbyAreasSlugs   String[]  @default([])
  internalLinksFrom  String[]  @default([])
  linkedInContent    Boolean   @default(false)
}
```

Or raw SQL:

```sql
ALTER TABLE areas
  ADD COLUMN nearby_areas_slugs jsonb DEFAULT '[]',
  ADD COLUMN internal_links_from jsonb DEFAULT '[]',
  ADD COLUMN linked_in_content boolean DEFAULT false;
```
