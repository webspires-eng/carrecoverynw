import { unstable_cache } from 'next/cache';
import { connectToDatabase } from '@/lib/db';

async function fetchAllActiveSlugs() {
    try {
        const { db } = await connectToDatabase();
        const rows = await db.collection('areas')
            .find({ is_active: true }, { projection: { slug: 1, _id: 0 } })
            .toArray();
        return rows.map((r) => r.slug).filter(Boolean);
    } catch (error) {
        console.error('Failed to load active slugs:', error);
        return [];
    }
}

// revalidate: false — never time-expire. Consumed by area pages during render,
// so a numeric revalidate here would force their effective ISR revalidate down
// and drive ISR writes. Invalidated on demand via revalidateTag('areas') when an
// area is published (see publishPipeline / api/admin/revalidate-all).
export const getAllActiveSlugs = unstable_cache(
    fetchAllActiveSlugs,
    ['all-active-area-slugs'],
    { revalidate: false, tags: ['areas'] }
);
