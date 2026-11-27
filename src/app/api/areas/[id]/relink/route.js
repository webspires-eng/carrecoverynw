import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/db';
import { runPublishPipeline } from '@/lib/publishPipeline';
import { adminGuard } from '@/lib/adminSession';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;


/**
 * POST /api/areas/[id]/relink
 *
 * Manual "Re-run Link Engine" trigger. Same pipeline as a fresh publish,
 * runs synchronously (caller waits for the result). Useful for retrofitting
 * existing pages or fixing a borked run.
 */
export async function POST(request, { params }) {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Invalid area id' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const area = await db
        .collection('areas')
        .findOne({ _id: new ObjectId(id) }, { projection: { slug: 1, is_active: 1 } });
    if (!area) {
        return NextResponse.json({ success: false, error: 'Area not found' }, { status: 404 });
    }
    if (!area.is_active) {
        return NextResponse.json(
            { success: false, error: 'Area must be active to run the link engine' },
            { status: 400 }
        );
    }

    const result = await runPublishPipeline(area.slug, { force: true });
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
