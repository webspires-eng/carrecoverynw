import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function POST() {
    try {
        const { db } = await connectToDatabase();
        
        // Define specific fixes for areas
        const areaFixes = {
            "Derby": {
                roads: ["A52", "A38", "A6", "M1"],
                areas: ["Nottingham", "Burton upon Trent", "Belper", "Matlock"]
            },
            "Nottingham": {
                roads: ["M1", "A52", "A453", "A610"],
                areas: ["Derby", "Mansfield", "Newark-on-Trent", "Ilkeston"]
            },
            "Leicester": {
                roads: ["M1", "M69", "A46", "A6"],
                areas: ["Loughborough", "Hinckley", "Melton Mowbray", "Market Harborough"]
            },
            // Add other East midlands if they matched wrong
        };

        const areas = await db.collection('areas').find({ is_active: true }).toArray();
        let updated = 0;
        
        for (const area of areas) {
            // Fix East Midlands cities that were generically lumped into "Midlands" (West Midlands roads)
            if (areaFixes[area.name]) {
                const fix = areaFixes[area.name];
                await db.collection('areas').updateOne(
                    { _id: area._id },
                    { 
                        $set: { 
                            major_roads: JSON.stringify(fix.roads), 
                            nearby_areas: JSON.stringify(fix.areas) 
                        } 
                    }
                );
                updated++;
            } 
            // Generic check for anything else in East Midlands
            else if (area.county && area.county.match(/Derbyshire|Nottinghamshire|Leicestershire|Lincolnshire|Northamptonshire|Rutland/i)) {
                // If they have West Midlands roads
                const roads = typeof area.major_roads === 'string' ? area.major_roads : JSON.stringify(area.major_roads);
                if (roads && roads.includes('M5')) {
                    await db.collection('areas').updateOne(
                        { _id: area._id },
                        { 
                            $set: { 
                                major_roads: JSON.stringify(["M1", "A1", "A46", "A14"]), 
                                nearby_areas: JSON.stringify(["Lincoln", "Northampton", "Kettering", "Corby"]) 
                            } 
                        }
                    );
                    updated++;
                }
            }
        }
        
        return NextResponse.json({ success: true, updated });
    } catch (error) {
        console.error('Error in temp route:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
