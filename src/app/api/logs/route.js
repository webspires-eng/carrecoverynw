import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

// GET all logs
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 50;
        const offset = (page - 1) * limit;

        const { db } = await connectToDatabase();

        const [rows, total] = await Promise.all([
            db.collection('activity_logs')
                .find({})
                .sort({ created_at: -1 }) // Newest first
                .skip(offset)
                .limit(limit)
                .toArray(),
            db.collection('activity_logs').countDocuments({})
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
        console.error('Database error fetching logs:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
