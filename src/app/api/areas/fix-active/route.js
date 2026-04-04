import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

// One-time fix: Set is_active = true on ALL area documents
// DELETE this file after running once
export async function POST(request) {
    try {
        const { db } = await connectToDatabase();
        
        // Count before
        const totalBefore = await db.collection('areas').countDocuments();
        const activeBefore = await db.collection('areas').countDocuments({ is_active: true });
        const inactiveBefore = await db.collection('areas').countDocuments({ is_active: { $ne: true } });
        
        // Update all areas to is_active: true
        const result = await db.collection('areas').updateMany(
            { is_active: { $ne: true } },
            { $set: { is_active: true } }
        );
        
        // Count after
        const activeAfter = await db.collection('areas').countDocuments({ is_active: true });
        
        // Get letter distribution
        const allAreas = await db.collection('areas')
            .find({ is_active: true }, { projection: { name: 1 } })
            .sort({ name: 1 })
            .toArray();
        
        const letterGroups = {};
        allAreas.forEach(a => {
            if (a.name) {
                const l = a.name[0].toUpperCase();
                letterGroups[l] = (letterGroups[l] || 0) + 1;
            }
        });
        
        return NextResponse.json({
            success: true,
            message: `Fixed ${result.modifiedCount} areas`,
            before: {
                total: totalBefore,
                active: activeBefore,
                inactive: inactiveBefore
            },
            after: {
                active: activeAfter
            },
            modifiedCount: result.modifiedCount,
            letterGroups,
            totalLetters: Object.keys(letterGroups).length
        });
    } catch (error) {
        console.error('Fix error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
