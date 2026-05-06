import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const BATCH = 10;

function unauthorized() {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

/**
 * POST /api/admin/revalidate-all
 *
 * Calls revalidatePath for every active /areas/<slug>, plus /areas and /.
 * Use this once after the backfill script to flush the static cache and
 * pull the new nearby_areas_slugs into rendered HTML.
 */
export async function POST(request) {
    const sessionCookie = request.cookies.get('admin_session');
    if (!sessionCookie?.value) return unauthorized();

    const { db } = await connectToDatabase();
    const slugs = (
        await db
            .collection('areas')
            .find({ is_active: true }, { projection: { _id: 0, slug: 1 } })
            .toArray()
    )
        .map((a) => a.slug)
        .filter(Boolean);

    let revalidated = 0;
    const errors = [];
    for (let i = 0; i < slugs.length; i += BATCH) {
        const batch = slugs.slice(i, i + BATCH);
        await Promise.all(
            batch.map((slug) => {
                try {
                    revalidatePath(`/areas/${slug}`);
                    revalidated += 1;
                } catch (err) {
                    errors.push(`${slug}: ${err.message}`);
                }
            })
        );
    }

    try {
        revalidatePath('/areas');
        revalidatePath('/');
        revalidatePath('/sitemap.xml');
    } catch (err) {
        errors.push(`root paths: ${err.message}`);
    }

    return NextResponse.json({
        success: errors.length === 0,
        total: slugs.length,
        revalidated,
        errors,
    });
}
