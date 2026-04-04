import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function POST() {
    try {
        const { db } = await connectToDatabase();
        
        // 1. ADD GLASGOW
        const glasgowExists = await db.collection('areas').findOne({ slug: 'glasgow' });
        if (!glasgowExists) {
            await db.collection('areas').insertOne({
                name: 'Glasgow',
                slug: 'glasgow',
                county: 'Scotland', // Adjust if needed
                region: 'Scotland',
                major_roads: JSON.stringify(['M8', 'M74', 'M77', 'M80', 'A8']),
                nearby_areas: JSON.stringify(['Edinburgh', 'Paisley', 'Motherwell', 'Hamilton']),
                meta_title: 'Car Recovery in Glasgow',
                meta_description: 'Fast and reliable car recovery services in Glasgow',
                h1_title: 'Car Recovery Service In Glasgow',
                intro_text: 'Local recovery experts available 24/7 in Glasgow.',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
        } else {
             // update instead
             await db.collection('areas').updateOne(
                { slug: 'glasgow' },
                {
                    $set: {
                        major_roads: JSON.stringify(['M8', 'M74', 'M77', 'M80', 'A8']),
                        nearby_areas: JSON.stringify(['Edinburgh', 'Paisley', 'Motherwell', 'Hamilton']),
                    }
                }
            );
        }

        // 2. UPDATE PORTSMOUTH
        await db.collection('areas').updateOne(
            { slug: 'portsmouth' },
            { 
                $set: { 
                    major_roads: JSON.stringify(['M27', 'A27', 'A3(M)', 'A2030']), 
                    nearby_areas: JSON.stringify(['Southampton', 'Fareham', 'Gosport', 'Havant']) 
                } 
            }
        );
        
        return NextResponse.json({ success: true, message: "Glasgow + Portsmouth fixed." });
    } catch (error) {
        console.error('Error in temp route:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
