/**
 * Verifies every <loc> in sitemap.xml returns a clean 200 with no redirects.
 *
 * Usage:
 *   npx tsx scripts/verifySitemap.ts
 *   npx tsx scripts/verifySitemap.ts https://www.cartowingnearme.co.uk/sitemap.xml
 *
 * Exits non-zero if any URL is non-200 or redirects, so this can gate CI.
 */
import fs from 'fs';
import path from 'path';

const DEFAULT_SITEMAP =
    process.argv[2] || 'https://www.cartowingnearme.co.uk/sitemap.xml';
const CONCURRENCY = 8;

type UrlResult = {
    url: string;
    status: number;
    location: string | null;
    ok: boolean;
    note: string;
};

async function fetchSitemap(url: string): Promise<string[]> {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'CarRecoveryUK-SitemapVerifier/1.0' },
    });
    if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status} ${url}`);
    const xml = await res.text();
    const matches = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g));
    return matches.map((m) => m[1].trim());
}

async function checkUrl(url: string): Promise<UrlResult> {
    try {
        const res = await fetch(url, {
            redirect: 'manual',
            headers: { 'User-Agent': 'CarRecoveryUK-SitemapVerifier/1.0' },
        });
        const location = res.headers.get('location');
        const isRedirect = res.status >= 300 && res.status < 400;
        const ok = res.status === 200;
        const note = ok
            ? 'OK'
            : isRedirect
                ? `REDIRECT → ${location || '(no location)'}`
                : `BAD STATUS ${res.status}`;
        return { url, status: res.status, location, ok, note };
    } catch (err) {
        return {
            url,
            status: 0,
            location: null,
            ok: false,
            note: `NETWORK ERROR: ${(err as Error).message}`,
        };
    }
}

async function runWithConcurrency<T, R>(
    items: T[],
    limit: number,
    worker: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = [];
    let i = 0;
    const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (i < items.length) {
            const idx = i++;
            results[idx] = await worker(items[idx]);
        }
    });
    await Promise.all(runners);
    return results;
}

async function main() {
    console.log(`Loading sitemap: ${DEFAULT_SITEMAP}`);
    const urls = await fetchSitemap(DEFAULT_SITEMAP);
    console.log(`Found ${urls.length} URLs. Checking with concurrency=${CONCURRENCY} ...`);

    const results = await runWithConcurrency(urls, CONCURRENCY, checkUrl);

    const bad = results.filter((r) => !r.ok);
    const outDir = path.join(process.cwd(), 'scripts', 'output');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
        path.join(outDir, 'sitemap-verify.json'),
        JSON.stringify({ checkedAt: new Date().toISOString(), total: results.length, bad }, null, 2)
    );

    if (bad.length === 0) {
        console.log(`All ${results.length} sitemap URLs return 200.`);
        return;
    }

    console.log(`\n${bad.length} of ${results.length} URLs are not clean 200s:`);
    for (const r of bad) {
        console.log(`  [${r.status}] ${r.url} — ${r.note}`);
    }
    process.exit(1);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
