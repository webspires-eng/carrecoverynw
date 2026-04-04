import mongodb from 'mongodb';
const { MongoClient } = mongodb;
const url = 'mongodb://carrecovery_app:CarRecovery2026%21SecurePass@72.61.113.79:27017/carrecoverynw?authSource=admin';
const client = new MongoClient(url, { connectTimeoutMS: 5000 });

async function run() {
    try {
        await client.connect();
        console.log("Connected!");
        const db = client.db();
        const york = await db.collection('areas').findOne({ slug: 'york' });
        console.log("York:", JSON.stringify(york, null, 2));
    } catch(e) {
        console.error("Connection failed:", e.message);
    } finally {
        await client.close();
    }
}
run();
