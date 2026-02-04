import { connectToDatabase } from '@/lib/db';

export async function getRecoveries() {
    try {
        const { db } = await connectToDatabase();
        const recoveriesCollection = db.collection('recoveries');
        
        const rows = await recoveriesCollection
            .find({ is_active: true })
            .sort({ display_order: 1 })
            .toArray();
        
        return rows;
    } catch (error) {
        console.error('Database error fetching recoveries:', error);
        return [];
    }
}
