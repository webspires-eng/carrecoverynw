import { connectToDatabase } from '@/lib/db';

export async function getServices() {
    try {
        const { db } = await connectToDatabase();
        const servicesCollection = db.collection('services');
        
        const rows = await servicesCollection
            .find({ is_active: true })
            .sort({ display_order: 1 })
            .toArray();
        
        return rows;
    } catch (error) {
        console.error('Database error fetching services:', error);
        return [];
    }
}
