import { connectToDatabase } from './src/lib/db.js';

async function getCities() {
    try {
        const { db } = await connectToDatabase();
        // find areas where major_roads is empty array or missing, EXCEPT the ones we already know
        const areas = await db.collection('areas').find({
            is_active: true,
            $or: [
                { major_roads: { $exists: false } },
                { major_roads: { $size: 0 } },
                { major_roads: "[]" }
            ]
        }, { projection: { name: 1, county: 1 } }).toArray();

        console.log(JSON.stringify(areas.map(a => a.name)));
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
getCities();
