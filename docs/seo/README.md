# SEO & Crawl Optimisation Reports

Record of work done across four related tasks. Each report covers what changed, where it lives, what's left to do, and known caveats.

| # | Report | Status |
|---|---|---|
| 1 | [Sub-area auto-linking](./01-sub-area-auto-linking.md) | Implemented |
| 2 | [Redirect cleanup](./02-redirect-cleanup.md) | Tooling shipped, fixes pending audit |
| 3 | [Crawl-budget optimisation](./03-crawl-budget.md) | Implemented |
| 4 | [Publish-time linking pipeline](./04-publish-pipeline.md) | Implemented, needs admin wire-up |

## Run order for a fresh deploy

```bash
# 1. Install / pull latest
npm install

# 2. Add the new fields to existing area documents (idempotent)
node scripts/migrate-internal-linking.mjs

# 3. Verify slug matching coverage on existing data
npx tsx scripts/auditSubAreaLinks.ts

# 4. Verify sitemap returns clean 200s
npx tsx scripts/verifySitemap.ts

# 5. Deploy. After deploy, paste failing URLs from Search Console into
#    scripts/auditRedirects.ts and run:
npx tsx scripts/auditRedirects.ts
```

## Environment

`.env.local` should contain at least:

```
MONGODB_URI=...
SITE_URL=https://www.cartowingnearme.co.uk
CRON_SECRET=...                 # required for Vercel-cron auth
GOOGLE_INDEXING_KEY_JSON=...    # for the publish pipeline's IndexNow step
```
