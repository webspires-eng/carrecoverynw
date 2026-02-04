import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

// Bulk import areas from CSV/JSON data
export async function POST(request) {
    try {
        const { areas } = await request.json();

        if (!Array.isArray(areas) || areas.length === 0) {
            return NextResponse.json({ success: false, error: 'Areas array is required' }, { status: 400 });
        }

        let inserted = 0;
        let skipped = 0;
        const errors = [];

        const { db } = await connectToDatabase();

        for (const area of areas) {
            try {
                const slug = area.slug || area.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                const result = await db.collection('areas').updateOne(
                    { slug },
                    {
                        $set: {
                            slug,
                            name: area.name,
                            county: area.county || null,
                            region: area.region || 'West Midlands',
                            meta_title: area.meta_title || `24/7 Car Recovery in ${area.name} | Car Recovery UK`,
                            meta_description: area.meta_description || `Fast and reliable car recovery services in ${area.name}. Available 24/7 for breakdowns, accidents, and vehicle transport.`,
                            h1_title: area.h1_title || `24/7 Car Recovery & Emergency Towing in ${area.name}`,
                            intro_text: area.intro_text || `Professional car recovery and breakdown assistance in ${area.name}. Our recovery team is on standby 24/7 to assist with all your vehicle needs.`,
                            postcode_prefix: area.postcode_prefix || null,
                            major_roads: area.major_roads || [],
                            is_active: true,
                            updated_at: new Date()
                        },
                        $setOnInsert: {
                            created_at: new Date()
                        }
                    },
                    { upsert: true }
                );

                if (result.upsertedCount > 0) {
                    inserted++;
                }
            } catch (err) {
                skipped++;
                errors.push({ area: area.name, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Bulk import complete: ${inserted} inserted, ${skipped} skipped`,
            inserted,
            skipped,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Bulk import error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
