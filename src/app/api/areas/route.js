import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET all areas
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 50;
        const search = searchParams.get('search') || '';
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM areas WHERE is_active = 1';
        let countQuery = 'SELECT COUNT(*) as total FROM areas WHERE is_active = 1';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR slug LIKE ? OR county LIKE ?)';
            countQuery += ' AND (name LIKE ? OR slug LIKE ? OR county LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await pool.execute(query, params);
        const [countResult] = await pool.execute(countQuery, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []);

        return NextResponse.json({
            success: true,
            data: rows,
            pagination: {
                page,
                limit,
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
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
            custom_faqs
        } = body;

        if (!slug || !name) {
            return NextResponse.json({ success: false, error: 'Slug and name are required' }, { status: 400 });
        }

        const [result] = await pool.execute(
            `INSERT INTO areas (slug, name, county, region, meta_title, meta_description, h1_title, intro_text, latitude, longitude, postcode_prefix, nearby_areas, major_roads, custom_services, custom_faqs) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                slug,
                name,
                county || null,
                region,
                meta_title || `24/7 Car Recovery in ${name} | Car Recovery UK`,
                meta_description || `Fast and reliable car recovery services in ${name}. Available 24/7 for breakdowns, accidents, and vehicle transport.`,
                h1_title || `24/7 Car Recovery & Emergency Towing in ${name}`,
                intro_text || null,
                latitude || null,
                longitude || null,
                postcode_prefix || null,
                JSON.stringify(nearby_areas || []),
                JSON.stringify(major_roads || []),
                custom_services || null,
                JSON.stringify(custom_faqs || [])
            ]
        );

        return NextResponse.json({ success: true, id: result.insertId, message: 'Area created successfully' });
    } catch (error) {
        console.error('Database error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ success: false, error: 'An area with this slug already exists' }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
