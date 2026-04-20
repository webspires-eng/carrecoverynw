// Daily cron to auto-submit the next batch of URLs to Google's Indexing API.
// Triggered by Vercel Cron via vercel.json.
//
// Vercel automatically adds an Authorization header on cron invocations:
//   Authorization: Bearer ${CRON_SECRET}
// Set CRON_SECRET in Vercel project env vars to lock this endpoint down.
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { submitUrlToGoogle } from '@/lib/googleIndexing';

const SITE_URL = (process.env.SITE_URL || 'https://www.cartowingnearme.co.uk').replace(/\/$/, '');
const DAILY_BATCH = 190;          // under Google's 200/day quota
const CORE_PAGES = ['/', '/areas', '/about-us', '/contact-us', '/booking'];

export const dynamic = 'force-dynamic';
export const maxDuration = 300;   // 5 min — need time to submit ~190 URLs sequentially

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

export async function GET(request) {
    // Authenticate: accept either Vercel's cron header or a manual call with matching secret.
    const secret = process.env.CRON_SECRET;
    if (secret) {
        const auth = request.headers.get('authorization');
        if (auth !== `Bearer ${secret}`) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const { db } = await connectToDatabase();
        const col = db.collection('indexing_submissions');

        const allUrls = await buildUrlList(db);
        const done = await col.find({ status: 'submitted' }).project({ url: 1 }).toArray();
        const alreadyDone = new Set(done.map((d) => d.url));
        const pending = allUrls.filter((u) => !alreadyDone.has(u));

        if (pending.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'All URLs already submitted. Nothing to do.',
                submitted: 0,
            });
        }

        const todo = pending.slice(0, DAILY_BATCH);
        let ok = 0, fail = 0, quotaHit = false;

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
                const msg = (result.error || '').toLowerCase();
                if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('exhaust')) {
                    quotaHit = true;
                    break;
                }
            }
            await new Promise((r) => setTimeout(r, 200));
        }

        await db.collection('activity_logs').insertOne({
            action: 'CRON_INDEXING_RUN',
            details: {
                submitted: ok,
                failed: fail,
                quotaHit,
                remaining: pending.length - ok,
            },
            status: fail > 0 && ok === 0 ? 'error' : 'success',
            created_at: new Date(),
        });

        return NextResponse.json({
            success: true,
            submitted: ok,
            failed: fail,
            quotaHit,
            remaining: pending.length - ok,
            message: quotaHit
                ? `Stopped at quota. Submitted ${ok}, failed ${fail}.`
                : `Submitted ${ok}, failed ${fail}. ${pending.length - ok} pending.`,
        });
    } catch (e) {
        console.error('[Cron Indexing] Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
