import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

// PATCH update booking status
export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        const validStatuses = ['new', 'confirmed', 'dispatched', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();
        const result = await db.collection('bookings').updateOne(
            { _id: new ObjectId(id) },
            { $set: { status, updated_at: new Date() } }
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
