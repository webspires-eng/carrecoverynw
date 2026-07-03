import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

// All booking fields are optional (empty string is stored as null)
const OPTIONAL_FIELDS = ['name', 'phone', 'pickupLocation', 'serviceType', 'email', 'dropoffLocation', 'registrationNumber', 'vehicleMake', 'vehicleModel', 'message'];

// PATCH update booking (any editable field, status and/or price)
export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, price } = body;

        const updates = {};

        for (const field of OPTIONAL_FIELDS) {
            if (body[field] !== undefined) {
                const value = body[field] === null ? '' : String(body[field]).trim();
                updates[field] = value || null;
            }
        }

        if (status !== undefined) {
            const validStatuses = ['new', 'confirmed', 'dispatched', 'completed', 'cancelled', 'lost'];
            if (!validStatuses.includes(status)) {
                return NextResponse.json(
                    { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                    { status: 400 }
                );
            }
            updates.status = status;
        }

        if (price !== undefined) {
            const parsed = price === null || price === '' ? null : Number(price);
            if (parsed !== null && (Number.isNaN(parsed) || parsed < 0)) {
                return NextResponse.json(
                    { success: false, error: 'Price must be a positive number' },
                    { status: 400 }
                );
            }
            updates.price = parsed;
        }

        const bookingDate = body.bookingDate;
        if (bookingDate !== undefined && bookingDate && Number.isNaN(new Date(bookingDate).getTime())) {
            return NextResponse.json(
                { success: false, error: 'Invalid booking date' },
                { status: 400 }
            );
        }

        if (Object.keys(updates).length === 0 && !bookingDate) {
            return NextResponse.json(
                { success: false, error: 'Nothing to update' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        // Date-only value: change the date but keep the booking's original time of day
        if (bookingDate) {
            const date = new Date(bookingDate);
            if (/^\d{4}-\d{2}-\d{2}$/.test(String(bookingDate))) {
                const existing = await db.collection('bookings').findOne(
                    { _id: new ObjectId(id) },
                    { projection: { created_at: 1 } }
                );
                if (existing?.created_at) {
                    const prev = new Date(existing.created_at);
                    date.setHours(prev.getHours(), prev.getMinutes(), prev.getSeconds(), 0);
                }
            }
            updates.created_at = date;
        }
        const result = await db.collection('bookings').updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updates, updated_at: new Date() } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Booking updated' });
    } catch (error) {
        console.error('Booking PATCH error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE booking
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const { db } = await connectToDatabase();

        const result = await db.collection('bookings').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Booking deleted' });
    } catch (error) {
        console.error('Booking DELETE error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
