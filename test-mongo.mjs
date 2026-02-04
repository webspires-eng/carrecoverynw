import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testMongo() {
    const uri = process.env.MONGODB_URI;
    console.log('Testing MongoDB connection...');
    console.log('URI:', uri.replace(/:[^:@]+@/, ':****@')); // Hide password
    
    try {
        const client = new MongoClient(uri);
        await client.connect();
        
        const db = client.db('carrecoverynw');
        
        // Test each collection
        const settings = await db.collection('settings').countDocuments();
        const services = await db.collection('services').countDocuments();
        const recoveries = await db.collection('recoveries').countDocuments();
        const areas = await db.collection('areas').countDocuments();
        
        console.log('✅ Connected successfully!');
        console.log(`📊 Settings: ${settings} documents`);
        console.log(`📊 Services: ${services} documents`);
        console.log(`📊 Recoveries: ${recoveries} documents`);
        console.log(`📊 Areas: ${areas} documents`);
        
        await client.close();
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    }
}

testMongo();
