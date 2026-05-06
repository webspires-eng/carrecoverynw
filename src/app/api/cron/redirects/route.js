// Weekly cron: scans every URL in the sitemap and reports any that have
// drifted into a redirect chain, ended in 404, or otherwise stopped
// returning a clean 200. Schedule via vercel.json.
//
// Vercel adds Authorization: Bearer ${CRON_SECRET} on cron invocations.
import { NextResponse } from 'next/server';
import { getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CONCURRENCY = 8;

async function runConcurrent(items, limit, worker) {
    const results = [];
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

async function loadSitemapUrls(siteUrl) {
    const res = await fetch(`${siteUrl}/sitemap.xml`, {
        headers: { 'User-Agent': 'CarRecoveryUK-RedirectMonitor/1.0' },
    });
    if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status}`);
    const xml = await res.text();
    return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1].trim());
}

async function inspect(url) {
    try {
        const res = await fetch(url, {
            redirect: 'manual',
            headers: { 'User-Agent': 'CarRecoveryUK-RedirectMonitor/1.0' },
        });
        const isRedirect = res.status >= 300 && res.status < 400;
        return {
            url,
            status: res.status,
            location: res.headers.get('location'),
            ok: res.status === 200,
            isRedirect,
        };
    } catch (err) {
        return { url, status: 0, location: null, ok: false, isRedirect: false, error: String(err) };
    }
}

export async function GET(request) {
    const expected = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    if (expected && authHeader !== `Bearer ${expected}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const siteUrl = getSiteUrl();
    const urls = await loadSitemapUrls(siteUrl);
    const results = await runConcurrent(urls, CONCURRENCY, inspect);

    const problems = results.filter((r) => !r.ok);
    const summary = {
        checkedAt: new Date().toISOString(),
        total: results.length,
        problemCount: problems.length,
        problems,
    };

    if (problems.length > 0) {
        console.warn(
            `[redirect-monitor] ${problems.length} of ${results.length} sitemap URLs are not clean 200s`
        );
        for (const p of problems) {
            console.warn(`  [${p.status}] ${p.url} → ${p.location || '(no location)'}`);
        }
    } else {
        console.log(`[redirect-monitor] all ${results.length} sitemap URLs are clean 200s`);
    }

    return NextResponse.json(summary, {
        status: problems.length > 0 ? 200 : 200,
    });
}
