import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
    if (!uri) {
        throw new Error('Missing MONGODB_URI environment variable');
    }

    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000
    });
    
    await client.connect();
    const db = client.db('carrecoverynw');

    cachedClient = client;
    cachedDb = db;

    return { client, db };
}

export default connectToDatabase;
