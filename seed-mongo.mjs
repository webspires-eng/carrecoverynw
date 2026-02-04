import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
}

async function seedDatabase() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('carrecoverynw');

        console.log('Seeding MongoDB collections...');

        // Clear existing collections
        await db.collection('settings').deleteMany({});
        await db.collection('services').deleteMany({});
        await db.collection('recoveries').deleteMany({});
        await db.collection('areas').deleteMany({});

        // Insert settings
        await db.collection('settings').insertMany([
            { setting_key: 'business_name', setting_value: 'Car Recovery UK' },
            { setting_key: 'phone', setting_value: '07360544819' },
            { setting_key: 'whatsapp', setting_value: '447360544819' },
            { setting_key: 'email', setting_value: 'info@carrecoveryuk.co.uk' },
            { setting_key: 'address', setting_value: 'West Midlands, UK' }
        ]);
        console.log('✅ Settings seeded');

        // Insert services
        await db.collection('services').insertMany([
            { name: 'Vehicle Breakdown Recovery', description: 'Professional breakdown assistance with immediate response', icon: 'wrench', display_order: 1, is_active: true },
            { name: 'Emergency Towing', description: '24/7 emergency towing services available', icon: 'truck', display_order: 2, is_active: true },
            { name: 'Accident Recovery', description: 'Specialized accident recovery and vehicle transport', icon: 'exclamation-triangle', display_order: 3, is_active: true },
            { name: 'Long Distance Transport', description: 'Safe and reliable vehicle transport across the UK', icon: 'road', display_order: 4, is_active: true },
            { name: 'Fuel Delivery', description: 'Emergency fuel delivery service to get you back on the road', icon: 'gas-pump', display_order: 5, is_active: true },
            { name: 'Lock Out Assistance', description: 'Professional vehicle lock out assistance', icon: 'lock', display_order: 6, is_active: true }
        ]);
        console.log('✅ Services seeded');

        // Insert recoveries
        await db.collection('recoveries').insertMany([
            { title: 'M6 Motorway Breakdown', description: 'Responded in 12 minutes to a stranded driver on the M6', customer_name: 'John M.', location: 'M6 Junction 6', vehicle_type: 'BMW 3 Series', display_order: 1, is_active: true },
            { title: 'Damaged Vehicle Transport', description: 'Successfully transported damaged vehicle 25 miles safely', customer_name: 'Sarah T.', location: 'Coventry to Warwick', vehicle_type: 'Toyota Corolla', display_order: 2, is_active: true },
            { title: 'Accident Scene Recovery', description: 'Swift and professional recovery from major accident scene', customer_name: 'Mike R.', location: 'Birmingham Intersection', vehicle_type: 'Mercedes C-Class', display_order: 3, is_active: true },
            { title: 'Fuel Delivery Service', description: 'Delivered fuel to driver stranded on motorway at night', customer_name: 'Emma L.', location: 'M42 Southbound', vehicle_type: 'Ford Focus', display_order: 4, is_active: true },
            { title: 'Vehicle Lock Out', description: 'Quick response to locked vehicle emergency', customer_name: 'David K.', location: 'Dudley Town Centre', vehicle_type: 'Volkswagen Golf', display_order: 5, is_active: true },
            { title: 'Multi-Vehicle Recovery', description: 'Professional handling of complex multi-vehicle recovery', customer_name: 'Robert J.', location: 'Wolverhampton M6', vehicle_type: 'Multiple Vehicles', display_order: 6, is_active: true }
        ]);
        console.log('✅ Recoveries seeded');

        // Insert areas
        await db.collection('areas').insertMany([
            { slug: 'birmingham', name: 'Birmingham', county: 'West Midlands', region: 'West Midlands', h1_title: '24/7 Car Recovery & Emergency Towing in Birmingham', intro_text: 'Fast and reliable car recovery services across Birmingham city centre and surrounding areas.', postcode_prefix: 'B', major_roads: ['M6', 'M5', 'M42', 'A38', 'A45'], is_active: true },
            { slug: 'coventry', name: 'Coventry', county: 'West Midlands', region: 'West Midlands', h1_title: '24/7 Car Recovery & Emergency Towing in Coventry', intro_text: 'Professional car recovery and breakdown assistance in Coventry.', postcode_prefix: 'CV', major_roads: ['M6', 'M42', 'M69', 'A45', 'A46'], is_active: true },
            { slug: 'wolverhampton', name: 'Wolverhampton', county: 'West Midlands', region: 'West Midlands', h1_title: '24/7 Car Recovery & Emergency Towing in Wolverhampton', intro_text: 'Emergency car recovery services in Wolverhampton and the Black Country.', postcode_prefix: 'WV', major_roads: ['M6', 'M54', 'A449', 'A454'], is_active: true },
            { slug: 'dudley', name: 'Dudley', county: 'West Midlands', region: 'West Midlands', h1_title: '24/7 Car Recovery & Emergency Towing in Dudley', intro_text: 'Reliable car recovery and towing services in Dudley.', postcode_prefix: 'DY', major_roads: ['M5', 'A456', 'A461'], is_active: true },
            { slug: 'solihull', name: 'Solihull', county: 'West Midlands', region: 'West Midlands', h1_title: '24/7 Car Recovery & Emergency Towing in Solihull', intro_text: 'Premium car recovery services in Solihull.', postcode_prefix: 'B', major_roads: ['M42', 'M40', 'A45', 'A41'], is_active: true }
        ]);
        console.log('✅ Areas seeded');

        // Create indexes for better performance
        console.log('Creating indexes...');
        await db.collection('settings').createIndex({ setting_key: 1 }, { unique: true });
        await db.collection('services').createIndex({ is_active: 1, display_order: 1 });
        await db.collection('recoveries').createIndex({ is_active: 1, display_order: 1 });
        await db.collection('areas').createIndex({ slug: 1 }, { unique: true });
        await db.collection('areas').createIndex({ is_active: 1 });
        console.log('✅ Indexes created');

        // Create app-specific user (non-root)
        console.log('Creating application user...');
        const adminDb = client.db('admin');
        
        try {
            await adminDb.command({
                createUser: 'carrecovery_app',
                pwd: 'CarRecovery2026!SecurePass',
                roles: [
                    { role: 'readWrite', db: 'carrecoverynw' }
                ]
            });
            console.log('✅ Application user created: carrecovery_app');
            console.log('📝 Update your connection string to:');
            console.log('   mongodb://carrecovery_app:CarRecovery2026!SecurePass@72.61.113.79:27017/carrecoverynw');
        } catch (err) {
            if (err.codeName === 'DuplicateKey') {
                console.log('ℹ️  Application user already exists');
            } else {
                console.error('⚠️  Could not create user (may need admin privileges):', err.message);
            }
        }

        console.log('✅ Database seeding completed!');
    } finally {
        await client.close();
    }
}

seedDatabase().catch(console.error);
