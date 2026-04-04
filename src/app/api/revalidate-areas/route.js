import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db';

// Purge ISR cache for all area pages
// DELETE this file after running once
export async function POST() {
    try {
        const { db } = await connectToDatabase();
        const areas = await db.collection('areas')
            .find({ is_active: true }, { projection: { slug: 1 } })
            .toArray();

        let revalidated = 0;

        // Revalidate each area page
        for (const area of areas) {
            revalidatePath(`/areas/${area.slug}`);
            revalidated++;
        }

        // Also revalidate the areas listing and homepage
        revalidatePath('/areas');
        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: `Revalidated ${revalidated} area pages + /areas + /`,
            totalPages: revalidated + 2
        });
    } catch (error) {
        console.error('Revalidation error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
