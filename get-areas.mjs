import { MongoClient } from 'mongodb';

const url = 'mongodb://carrecovery_app:CarRecovery2026%21SecurePass@72.61.113.79:27017/carrecoverynw?authSource=admin';
const client = new MongoClient(url);

async function run() {
    await client.connect();
    const db = client.db();
    
    // Find areas that have M6, M5, M42 in their major roads but are NOT West Midlands
    const areas = await db.collection('areas').find({
        is_active: true,
        major_roads: { $regex: /M6, M5, M42/i }
    }).toArray();
    
    const badAreas = areas.filter(a => {
        const c = (a.county || "").toLowerCase();
        return !c.includes('west midlands');
    });
    
    console.log(badAreas.map(a => a.name).join(', '));
    await client.close();
}
run();
