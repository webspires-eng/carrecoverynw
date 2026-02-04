import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

// GET all areas
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 50;
        const search = searchParams.get('search') || '';
        const offset = (page - 1) * limit;

        const { db } = await connectToDatabase();
        const filter = { is_active: true };

        if (search) {
            const regex = new RegExp(search, 'i');
            filter.$or = [{ name: regex }, { slug: regex }, { county: regex }];
        }

        const [rows, total] = await Promise.all([
            db.collection('areas')
                .find(filter)
                .sort({ name: 1 })
                .skip(offset)
                .limit(limit)
                .toArray(),
            db.collection('areas').countDocuments(filter)
        ]);

        const data = rows.map(row => ({
            ...row,
            id: row._id.toString()
        }));

        return NextResponse.json({
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST create new area
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            slug,
            name,
            county,
            region = 'West Midlands',
            meta_title,
            meta_description,
            h1_title,
            intro_text,
            latitude,
            longitude,
            postcode_prefix,
            nearby_areas,
            major_roads,
            custom_services,
            custom_faqs,
            custom_recoveries
        } = body;

        if (!slug || !name) {
            return NextResponse.json({ success: false, error: 'Slug and name are required' }, { status: 400 });
        }

        const { db } = await connectToDatabase();

        // Check for existing area with same slug or name
        const existing = await db.collection('areas').findOne({
            $or: [{ slug }, { name }]
        });

        if (existing) {
            const duplicateField = (existing.slug === slug) ? 'slug' : 'name';
            return NextResponse.json({
                success: false,
                error: `An area with this ${duplicateField} already exists (${existing[duplicateField]})`
            }, { status: 409 });
        }

        const result = await db.collection('areas').insertOne({
            slug,
            name,
            county: county || null,
            region,
            meta_title: meta_title || `24/7 Car Recovery in ${name} | Car Recovery UK`,
            meta_description: meta_description || `Fast and reliable car recovery services in ${name}. Available 24/7 for breakdowns, accidents, and vehicle transport.`,
            h1_title: h1_title || `24/7 Car Recovery & Emergency Towing in ${name}`,
            intro_text: intro_text || null,
            latitude: latitude || null,
            longitude: longitude || null,
            postcode_prefix: postcode_prefix || null,
            nearby_areas: nearby_areas || [],
            major_roads: major_roads || [],
            custom_services: custom_services || null,
            custom_faqs: custom_faqs || [],
            custom_recoveries: custom_recoveries || null,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        });

        return NextResponse.json({ success: true, id: result.insertedId.toString(), message: 'Area created successfully' });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
