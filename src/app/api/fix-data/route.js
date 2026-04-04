import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function POST() {
    try {
        const { db } = await connectToDatabase();
        
        const regionalData = {
            "London & South East": {
                roads: ["M25", "M1", "M4", "M3", "A406"],
                areas: ["Greater London", "Reading", "Slough", "Watford", "Croydon"]
            },
            "South West": {
                roads: ["M5", "M4", "A38", "A303", "A30"],
                areas: ["Bristol", "Exeter", "Plymouth", "Gloucester", "Bath"]
            },
            "Midlands": {
                roads: ["M6", "M5", "M42", "M1", "A38"],
                areas: ["Birmingham", "Coventry", "Leicester", "Nottingham", "Derby"]
            },
            "North West": {
                roads: ["M60", "M62", "M6", "M56", "M61"],
                areas: ["Manchester", "Liverpool", "Preston", "Bolton", "Stockport"]
            },
            "Yorkshire & North East": {
                roads: ["M1", "A1(M)", "M62", "A19", "A64"],
                areas: ["Leeds", "Sheffield", "York", "Newcastle", "Middlesbrough"]
            },
            "Scotland": {
                roads: ["M8", "M9", "M74", "A90", "A9"],
                areas: ["Glasgow", "Edinburgh", "Aberdeen", "Dundee", "Inverness"]
            },
            "Wales": {
                roads: ["M4", "A470", "A55", "A465", "A483"],
                areas: ["Cardiff", "Swansea", "Newport", "Wrexham", "Bangor"]
            },
            "East of England": {
                roads: ["M11", "A14", "A1(M)", "A12", "A47"],
                areas: ["Cambridge", "Norwich", "Peterborough", "Ipswich", "Luton"]
            }
        };

        function assignRegion(city, county) {
            const c = (city + " " + (county || "")).toLowerCase();
            if (c.match(/london|surrey|kent|essex|sussex|berkshire|hampshire|oxfordshire/)) return regionalData["London & South East"];
            if (c.match(/bristol|somerset|devon|cornwall|gloucestershire|dorset|wiltshire|bath/)) return regionalData["South West"];
            if (c.match(/manchester|lancashire|merseyside|cheshire|cumbria|salford/)) return regionalData["North West"];
            if (c.match(/yorkshire|tyne|wear|durham|northumberland|leeds|sheffield|york/)) return regionalData["Yorkshire & North East"];
            if (c.match(/scotland|glasgow|edinburgh|aberdeen/)) return regionalData["Scotland"];
            if (c.match(/wales|cardiff|swansea|newport|gwent/)) return regionalData["Wales"];
            if (c.match(/cambridge|norfolk|suffolk|bedfordshire|hertfordshire|luton/)) return regionalData["East of England"];
            return regionalData["Midlands"];
        }

        const areas = await db.collection('areas').find({ is_active: true }).toArray();
        let updated = 0;
        
        for (const area of areas) {
            const region = assignRegion(area.name, area.county);
            
            // Overwrite if it's not actually West Midlands county, and region is not Midlands
            if (!area.county?.includes('West Midlands') && region !== regionalData["Midlands"]) {
                await db.collection('areas').updateOne(
                    { _id: area._id },
                    { 
                        $set: { 
                            major_roads: JSON.stringify(region.roads), 
                            nearby_areas: JSON.stringify(region.areas) 
                        } 
                    }
                );
                updated++;
            }
        }
        
        return NextResponse.json({ success: true, updated });
    } catch (error) {
        console.error('Error in temp route:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
