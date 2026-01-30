import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET single area by ID
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const [rows] = await pool.execute('SELECT * FROM areas WHERE id = ?', [id]);

        if (rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Area not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT update area
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();

        const fields = [];
        const values = [];

        const allowedFields = [
            'slug', 'name', 'county', 'region', 'meta_title', 'meta_description',
            'h1_title', 'intro_text', 'latitude', 'longitude', 'postcode_prefix',
            'nearby_areas', 'major_roads', 'custom_services', 'custom_faqs', 'custom_recoveries', 'is_active'
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                fields.push(`${field} = ?`);
                if (['nearby_areas', 'major_roads', 'custom_faqs'].includes(field)) {
                    values.push(JSON.stringify(body[field]));
                } else {
                    values.push(body[field]);
                }
            }
        }

        // Default is_active to 1 if not provided (ensures areas are active by default when editing)
        if (body.is_active === undefined) {
            fields.push('is_active = ?');
            values.push(1);
        }

        if (fields.length === 0) {
            return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
        }

        // Check for duplicate slug or name if they are being updated
        if (body.slug || body.name) {
            const checkFields = [];
            const checkValues = [];
            if (body.slug) { checkFields.push('slug = ?'); checkValues.push(body.slug); }
            if (body.name) { checkFields.push('name = ?'); checkValues.push(body.name); }

            const [existing] = await pool.execute(
                `SELECT id, slug, name FROM areas WHERE (${checkFields.join(' OR ')}) AND id != ?`,
                [...checkValues, id]
            );

            if (existing.length > 0) {
                const match = existing[0];
                const duplicateField = (match.slug === body.slug) ? 'slug' : 'name';
                return NextResponse.json({
                    success: false,
                    error: `Another area with this ${duplicateField} already exists (${match[duplicateField]})`
                }, { status: 409 });
            }
        }

        values.push(id);

        await pool.execute(
            `UPDATE areas SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return NextResponse.json({ success: true, message: 'Area updated successfully' });
    } catch (error) {
        console.error('Database error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ success: false, error: 'An area with this name or slug already exists' }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE area
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        await pool.execute('DELETE FROM areas WHERE id = ?', [id]);

        return NextResponse.json({ success: true, message: 'Area deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
