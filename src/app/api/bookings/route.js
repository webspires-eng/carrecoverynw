import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { sendBookingEmail } from '@/lib/email';

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
                { registrationNumber: regex },
            ];
        }

        if (status && status !== 'all') {
            filter.status = status;
        }

        const [rows, total, countsAgg] = await Promise.all([
            db.collection('bookings')
                .find(filter)
                .sort({ created_at: -1 })
                .skip(offset)
                .limit(limit)
                .toArray(),
            db.collection('bookings').countDocuments(filter),
            db.collection('bookings').aggregate([
                { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: { $ifNull: ['$price', 0] } } } }
            ]).toArray()
        ]);

        const data = rows.map(row => ({
            ...row,
            id: row._id.toString()
        }));

        // Global status counts (unfiltered) for the dashboard stat cards / tabs.
        // Revenue = total job value of completed bookings.
        const counts = { total: 0, revenue: 0 };
        for (const c of countsAgg) {
            counts[c._id || 'new'] = (counts[c._id || 'new'] || 0) + c.count;
            counts.total += c.count;
            if (c._id === 'completed') counts.revenue += c.revenue || 0;
        }

        return NextResponse.json({
            success: true,
            data,
            counts,
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
        const { name, phone, email, pickupLocation, dropoffLocation, serviceType, registrationNumber, vehicleMake, vehicleModel, message, manual, status, price, bookingDate } = body;

        if (!name || !phone || !pickupLocation || !serviceType) {
            return NextResponse.json(
                { success: false, error: 'Name, phone, pickup location, and service type are required' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        // Manual bookings can set a job value and backdate the booking
        const parsedPrice = manual && price !== undefined && price !== null && price !== '' ? Number(price) : null;
        let createdAt = new Date();
        if (manual && bookingDate) {
            const d = new Date(bookingDate);
            if (!Number.isNaN(d.getTime())) {
                // Date-only value: keep the current time of day rather than midnight
                if (/^\d{4}-\d{2}-\d{2}$/.test(String(bookingDate))) {
                    const now = new Date();
                    d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
                }
                createdAt = d;
            }
        }

        const result = await db.collection('bookings').insertOne({
            name,
            phone,
            email: email || null,
            pickupLocation,
            dropoffLocation: dropoffLocation || null,
            serviceType,
            registrationNumber: registrationNumber || null,
            vehicleMake: vehicleMake || null,
            vehicleModel: vehicleModel || null,
            message: message || null,
            status: manual && status ? status : 'new',
            source: manual ? 'manual' : 'website',
            price: parsedPrice !== null && !Number.isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : null,
            created_at: createdAt,
            updated_at: new Date(),
        });

        // Send email notification (fire-and-forget).
        // Skip for admin-entered manual bookings — the business already knows about them.
        if (!manual) {
            sendBookingEmail({ name, phone, email, pickupLocation, dropoffLocation, serviceType, registrationNumber, vehicleMake, vehicleModel, message }).catch(err => {
                console.error('[Bookings] Email notification failed:', err.message);
            });
        }

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
