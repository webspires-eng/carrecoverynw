# 01 — Sub-area auto-linking

## Problem

The "Areas We Cover in [City]" section on every area page rendered sub-areas as plain text. Many of those names had matching `/areas/[slug]` pages that already existed but weren't linked, so Google had no crawl signal between related pages.

Example: the Kensington page lists "South Kensington, Fulham, Hammersmith, Chelsea…" — all of which have their own pages, none of which were anchors.

## What was built

| Layer | File | Purpose |
|---|---|---|
| Slug matcher | [src/lib/slugMatcher.ts](../../src/lib/slugMatcher.ts) | `matchNameToSlug(name, allSlugs)` with 8 normalisation rules. `buildSubAreasHTML(subAreasText, allSlugs, currentSlug)` returns structured `{ linked, total, html: SubAreaItem[] }`. |
| Cached slug list | [src/lib/areas.js](../../src/lib/areas.js) | `getAllActiveSlugs()` wrapped in `unstable_cache` (1h TTL, `areas` tag). One DB hit per hour, not per page render. |
| Page wiring | [src/app/areas/[slug]/page.jsx](../../src/app/areas/%5Bslug%5D/page.jsx) | All data (`area`, `services`, `recoveries`, `settings`, `allActiveSlugs`) fetched in parallel via `Promise.all`. |
| Render | [src/components/CoverageSection.jsx](../../src/components/CoverageSection.jsx) | Converted from client to server component. Renders `<Link>` where slug matches, `<span>` otherwise. Never self-links to `currentSlug`. |
| Style | [src/styles/sections/coverage.css](../../src/styles/sections/coverage.css) | Minor `a.area-tag.linked` rule so the anchor variant inherits the existing tag look. |
| Tests | [src/lib/slugMatcher.test.ts](../../src/lib/slugMatcher.test.ts) | 18 tests, one per normalisation rule + `buildSubAreasHTML` behaviour. All pass. |
| Audit | [scripts/auditSubAreaLinks.ts](../../scripts/auditSubAreaLinks.ts) | Reports per-area `linked`/`total`/`unmatched` counts; writes `scripts/output/subarea-audit.json`. |

## Normalisation rules (slugMatcher)

1. Trim whitespace
2. Lowercase
3. Strip apostrophes (straight + curly): `Shepherd's` → `shepherds`
4. Spaces and underscores → `-`
5. Strip non-`[a-z0-9-]` characters
6. Direct match against `allSlugs`
7. Variant attempts (in order):
   - `st-` ↔ `saint-` swap
   - Strip `london-borough-of-`, `royal-borough-of-`, `city-of-` prefixes
   - Replace `-and-` with `-`
8. Return matched slug or `null`

## Verify

```bash
# Unit tests
npx tsx --test src/lib/slugMatcher.test.ts

# Coverage report against real DB data
npx tsx scripts/auditSubAreaLinks.ts
# → scripts/output/subarea-audit.json
```

After deploy, view-source on any area page and search for a sub-area name in the raw HTML — it should be inside an `<a>` tag, not a `<span>`.

## Schema note

Spec described a `subAreas` field; codebase has only `nearby_areas` (JSON array of strings). The matcher accepts both string and array input, so no migration was needed.

## Known caveats

- The slug list is cached for 1 hour. New areas published mid-cache will not appear as link targets on existing pages until the cache expires or `revalidateTag('areas')` is called.
- `aria-label` is set to `"Car recovery service in [Name]"`. If you change the brand wording, update `CoverageSection.jsx`.
