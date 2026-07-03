This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploying

Pushes to `main` normally auto-deploy via the Vercel GitHub integration
(project: `carrecoverynw`, team: `atif-jans-projects`).

**If a push doesn't trigger a deployment** (webhook failure — happened
2026-07-02), deploy manually from the project root:

```bash
npx vercel deploy --prod
```

If auto-deploys stay broken, reconnect the repo: Vercel dashboard →
carrecoverynw → Settings → Git → disconnect/reconnect `webspires-eng/carrecoverynw`.

Note: the build **fails loudly on MongoDB timeouts** (intentional — it refuses
to prerender area pages as empty soft-404s). If a build fails with a Mongo
server-selection error, just retry the deploy.

## SEO / content tooling (scripts/)

```bash
node scripts/validate-geo.mjs           # geography audit: nearby areas, roads, links vs real lat/lng
node scripts/validate-links.mjs         # internal-link integrity (exit 1 on errors — CI-friendly)
node scripts/fix-geo-data.mjs           # repair flagged geo data (dry-run; --apply writes with backup)
node scripts/export-content-worksheet.mjs --thin-only   # CSV worksheet for unique per-city content
node scripts/import-content-worksheet.mjs <csv> --apply # validated import of the filled worksheet
node scripts/prune-analysis.mjs         # KEEP / IMPROVE / PRUNE verdicts per area page
node scripts/set-noindex.mjs --from-prune-report        # noindex thin pages (dry-run; --apply writes)
```

Area pages are fully static: after any DB content change, redeploy (or call
`/api/admin/revalidate-all`) for it to go live.
