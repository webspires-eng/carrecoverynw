import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { submitUrlToGoogle } from '@/lib/googleIndexing';

const SITE_URL = (process.env.SITE_URL || 'https://www.cartowingnearme.co.uk').replace(/\/$/, '');
const DAILY_LIMIT = 200;          // Google's per-project per-day cap
const DEFAULT_BATCH = 50;         // per-request batch size
const CORE_PAGES = ['/', '/areas', '/about-us', '/contact-us', '/booking'];

// Build the full list of URLs we care about: core pages + all active areas.
async function buildUrlList(db) {
    const areas = await db
        .collection('areas')
        .find({ is_active: true })
        .project({ slug: 1 })
        .toArray();
    const core = CORE_PAGES.map((p) => `${SITE_URL}${p === '/' ? '' : p}`);
    const areaUrls = areas.map((a) => `${SITE_URL}/areas/${a.slug}`);
    return [...core, ...areaUrls];
}

async function getStats(db) {
    const all = await buildUrlList(db);
    const submissions = await db.collection('indexing_submissions').find({}).toArray();
    const byUrl = new Map(submissions.map((s) => [s.url, s]));

    let submitted = 0, failed = 0, pending = 0;
    const items = all.map((url) => {
        const rec = byUrl.get(url);
        if (rec?.status === 'submitted') submitted++;
        else if (rec?.status === 'failed') failed++;
        else pending++;
        return {
            url,
            status: rec?.status || 'pending',
            error: rec?.error || null,
            submitted_at: rec?.submitted_at || null,
            last_attempt_at: rec?.last_attempt_at || null,
            attempts: rec?.attempts || 0,
        };
    });

    // Count submissions in last 24h toward quota
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent24h = await db.collection('indexing_submissions').countDocuments({
        last_attempt_at: { $gte: since },
    });

    return {
        total: all.length,
        submitted,
        failed,
        pending,
        recent24h,
        dailyLimit: DAILY_LIMIT,
        items,
    };
}

/**
 * GET /api/indexing/bulk
 * Returns current status + per-URL detail.
 */
export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const stats = await getStats(db);
        return NextResponse.json({ success: true, ...stats });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

/**
 * POST /api/indexing/bulk
 * Body: { batchSize?: number, action?: 'run' | 'reset' | 'retry-failed' }
 *
 * - run (default): submit next N pending URLs
 * - reset: clear all submission history so everything is pending again
 * - retry-failed: mark failed URLs as pending so they're tried next run
 */
export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        const action = body.action || 'run';
        const { db } = await connectToDatabase();
        const col = db.collection('indexing_submissions');

        if (action === 'reset') {
            const res = await col.deleteMany({});
            return NextResponse.json({ success: true, message: `Reset ${res.deletedCount} records` });
        }

        if (action === 'retry-failed') {
            const res = await col.deleteMany({ status: 'failed' });
            return NextResponse.json({ success: true, message: `Cleared ${res.deletedCount} failed records` });
        }

        // action === 'run': submit next batch
        const batchSize = Math.min(Math.max(Number(body.batchSize) || DEFAULT_BATCH, 1), DAILY_LIMIT);
        const allUrls = await buildUrlList(db);
        const submittedDocs = await col.find({ status: 'submitted' }).project({ url: 1 }).toArray();
        const alreadyDone = new Set(submittedDocs.map((d) => d.url));
        const pending = allUrls.filter((u) => !alreadyDone.has(u));

        if (pending.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Nothing to submit — all URLs already submitted.',
                submitted: 0,
                failed: 0,
                quotaHit: false,
                remaining: 0,
            });
        }

        const todo = pending.slice(0, batchSize);
        let ok = 0, fail = 0, quotaHit = false;
        const errors = [];

        for (const url of todo) {
            const result = await submitUrlToGoogle(url, 'URL_UPDATED');
            if (result.success) {
                await col.updateOne(
                    { url },
                    {
                        $set: {
                            url,
                            status: 'submitted',
                            error: null,
                            submitted_at: new Date(),
                            last_attempt_at: new Date(),
                        },
                        $inc: { attempts: 1 },
                    },
                    { upsert: true },
                );
                ok++;
            } else {
                await col.updateOne(
                    { url },
                    {
                        $set: {
                            url,
                            status: 'failed',
                            error: result.error || 'Unknown error',
                            last_attempt_at: new Date(),
                        },
                        $inc: { attempts: 1 },
                    },
                    { upsert: true },
                );
                fail++;
                errors.push({ url, error: result.error });

                const msg = (result.error || '').toLowerCase();
                if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('exhaust')) {
                    quotaHit = true;
                    break;
                }
            }
            await new Promise((r) => setTimeout(r, 200));
        }

        const remaining = pending.length - ok;
        return NextResponse.json({
            success: true,
            submitted: ok,
            failed: fail,
            quotaHit,
            remaining,
            errors: errors.slice(0, 10),
            message: quotaHit
                ? `Stopped at quota. Submitted ${ok}, failed ${fail}. Try again tomorrow.`
                : `Submitted ${ok}, failed ${fail}. ${remaining} pending.`,
        });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
