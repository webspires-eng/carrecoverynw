import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/db';

// GET single area by ID
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: 'Invalid area id' }, { status: 400 });
        }

        const { db } = await connectToDatabase();
        const area = await db.collection('areas').findOne({ _id: new ObjectId(id) });

        if (!area) {
            return NextResponse.json({ success: false, error: 'Area not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: { ...area, id: area._id.toString() } });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT update area
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: 'Invalid area id' }, { status: 400 });
        }
        const body = await request.json();

        const allowedFields = [
            'slug', 'name', 'county', 'region', 'meta_title', 'meta_description',
            'h1_title', 'intro_text', 'latitude', 'longitude', 'postcode_prefix',
            'nearby_areas', 'major_roads', 'custom_services', 'custom_faqs', 'custom_recoveries', 'is_active', 'bottom_content'
        ];

        const updateData = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        // Default is_active to true if not provided
        if (body.is_active === undefined) {
            updateData.is_active = true;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
        }

        // Check for duplicate slug or name if they are being updated
        if (body.slug || body.name) {
            const { db } = await connectToDatabase();
            const existing = await db.collection('areas').findOne({
                $and: [
                    { _id: { $ne: new ObjectId(id) } },
                    { $or: [body.slug ? { slug: body.slug } : {}, body.name ? { name: body.name } : {}] }
                ]
            });

            if (existing) {
                const duplicateField = (existing.slug === body.slug) ? 'slug' : 'name';
                return NextResponse.json({
                    success: false,
                    error: `Another area with this ${duplicateField} already exists (${existing[duplicateField]})`
                }, { status: 409 });
            }
        }

        const { db } = await connectToDatabase();
        await db.collection('areas').updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updateData, updated_at: new Date() } }
        );

        return NextResponse.json({ success: true, message: 'Area updated successfully' });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE area
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: 'Invalid area id' }, { status: 400 });
        }

        const { db } = await connectToDatabase();
        await db.collection('areas').deleteOne({ _id: new ObjectId(id) });

        return NextResponse.json({ success: true, message: 'Area deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
