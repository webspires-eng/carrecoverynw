import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

// GET all bookings
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 25;
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const offset = (page - 1) * limit;

        const { db } = await connectToDatabase();
        const filter = {};

        if (search) {
            const regex = new RegExp(search, 'i');
            filter.$or = [
                { name: regex },
                { phone: regex },
                { email: regex },
                { pickupLocation: regex },
                { dropoffLocation: regex },
            ];
        }

        if (status && status !== 'all') {
            filter.status = status;
        }

        const [rows, total] = await Promise.all([
            db.collection('bookings')
                .find(filter)
                .sort({ created_at: -1 })
                .skip(offset)
                .limit(limit)
                .toArray(),
            db.collection('bookings').countDocuments(filter)
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
        console.error('Bookings GET error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST create new booking
export async function POST(request) {
    try {
        const body = await request.json();
        const { name, phone, email, pickupLocation, dropoffLocation, serviceType, vehicleMake, vehicleModel, message } = body;

        if (!name || !phone || !pickupLocation || !serviceType) {
            return NextResponse.json(
                { success: false, error: 'Name, phone, pickup location, and service type are required' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        const result = await db.collection('bookings').insertOne({
            name,
            phone,
            email: email || null,
            pickupLocation,
            dropoffLocation: dropoffLocation || null,
            serviceType,
            vehicleMake: vehicleMake || null,
            vehicleModel: vehicleModel || null,
            message: message || null,
            status: 'new',
            created_at: new Date(),
            updated_at: new Date(),
        });

        return NextResponse.json({
            success: true,
            id: result.insertedId.toString(),
            message: 'Booking created successfully'
        });
    } catch (error) {
        console.error('Bookings POST error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
