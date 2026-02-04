import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

async function createAdminUser() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('carrecoverynw');
        const usersCollection = db.collection('users');

        // Check if admin exists
        const existing = await usersCollection.findOne({ email: 'admin@carrecovery.co.uk' });
        
        if (existing) {
            console.log('⚠️  Admin user already exists');
            console.log('📧 Email: admin@carrecovery.co.uk');
            console.log('🔑 Password: Admin123!');
            await client.close();
            return;
        }

        // Create admin user
        await usersCollection.insertOne({
            name: 'Admin',
            email: 'admin@carrecovery.co.uk',
            password: 'Admin123!', // In production, use bcrypt to hash passwords
            role: 'admin',
            created_at: new Date()
        });

        // Create index
        await usersCollection.createIndex({ email: 1 }, { unique: true });

        console.log('✅ Admin user created successfully!');
        console.log('');
        console.log('🔐 Login Credentials:');
        console.log('📧 Email: admin@carrecovery.co.uk');
        console.log('🔑 Password: Admin123!');
        console.log('');
        console.log('⚠️  IMPORTANT: Change this password after first login in production!');

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        await client.close();
    }
}

createAdminUser();
