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

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // Async cleanup (fire-and-forget delete for logs older than 1 month)
        db.collection('activity_logs').deleteMany({ created_at: { $lt: oneMonthAgo } }).catch(err => {
            console.error('[Activity Logger] Failed to clean up old logs:', err.message);
        });

        // Filter for exactly 1 month
        const filterDate = { created_at: { $gte: oneMonthAgo } };

        const [rows, total] = await Promise.all([
            db.collection('activity_logs')
                .find(filterDate)
                .sort({ created_at: -1 }) // Newest first
                .skip(offset)
                .limit(limit)
                .toArray(),
            db.collection('activity_logs').countDocuments(filterDate)
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
