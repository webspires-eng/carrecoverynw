import { MongoClient } from 'mongodb';

const url = 'mongodb://carrecovery_app:CarRecovery2026%21SecurePass@72.61.113.79:27017/carrecoverynw?authSource=admin';
const client = new MongoClient(url);

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
    if (c.match(/bristol|somerset|devon|cornwall|gloucestershire|dorset|wiltshire/)) return regionalData["South West"];
    if (c.match(/manchester|lancashire|merseyside|cheshire|cumbria/)) return regionalData["North West"];
    if (c.match(/yorkshire|tyne|wear|durham|northumberland|leeds|sheffield|york/)) return regionalData["Yorkshire & North East"];
    if (c.match(/scotland|glasgow|edinburgh|aberdeen/)) return regionalData["Scotland"];
    if (c.match(/wales|cardiff|swansea|newport|gwent/)) return regionalData["Wales"];
    if (c.match(/cambridge|norfolk|suffolk|bedfordshire|hertfordshire/)) return regionalData["East of England"];
    return regionalData["Midlands"]; // Default
}

async function fixAreas() {
    try {
        await client.connect();
        const db = client.db();
        
        const areas = await db.collection('areas').find({
            is_active: true
        }).toArray();
        
        let updated = 0;
        
        for (const area of areas) {
            // Check if roads are empty or defaults are basically West Midlands
            let isDefault = false;
            try {
                const roads = typeof area.major_roads === 'string' ? JSON.parse(area.major_roads) : area.major_roads;
                if (!roads || roads.length === 0 || roads[0] === 'M6' && area.county && !area.county.match(/Midlands/i)) {
                    isDefault = true;
                }
            } catch(e) { isDefault = true; }
            
            // If they are missing proper data based on their county, assign it
            const region = assignRegion(area.name, area.county);
            
            // Wait, we need to make sure we don't overwrite legit West Midlands towns.
            // If the city is "York", it should get Yorkshire roads. 
            // If it's already M6 M5 but it's York, we should overwrite.
            if (!area.county?.includes('West Midlands') && region !== regionalData["Midlands"]) {
                console.log(`Fixing ${area.name} (${area.county}). Assigned to: ${region.roads.slice(0,3).join('/')}`);
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
        
        console.log(`Updated ${updated} areas.`);
    } finally {
        await client.close();
    }
}

fixAreas();
