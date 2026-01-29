import { NextResponse } from 'next/server';
import pool from '@/lib/db';

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

        for (const area of areas) {
            try {
                const slug = area.slug || area.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                await pool.execute(
                    `INSERT INTO areas (slug, name, county, region, meta_title, meta_description, h1_title, intro_text, postcode_prefix, major_roads) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
                    [
                        slug,
                        area.name,
                        area.county || null,
                        area.region || 'West Midlands',
                        area.meta_title || `24/7 Car Recovery in ${area.name} | ABZ Car Recovery`,
                        area.meta_description || `Fast and reliable car recovery services in ${area.name}. Available 24/7 for breakdowns, accidents, and vehicle transport.`,
                        area.h1_title || `24/7 Car Recovery & Emergency Towing in ${area.name}`,
                        area.intro_text || `Professional car recovery and breakdown assistance in ${area.name}. Our recovery team is on standby 24/7 to assist with all your vehicle needs.`,
                        area.postcode_prefix || null,
                        JSON.stringify(area.major_roads || [])
                    ]
                );
                inserted++;
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
