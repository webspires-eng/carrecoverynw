import { connectToDatabase } from './db';

/**
 * Log an administrative activity to the database.
 * 
 * @param {string} action - The action type (e.g. 'AREA_CREATED', 'GOOGLE_INDEX_SUBMISSION', 'AREA_UPDATED', 'AREA_DELETED', 'LOGIN')
 * @param {object} details - Additional contextual data (e.g. { slug: 'birmingham', name: 'Birmingham' })
 * @param {'success' | 'error' | 'info' | 'warning'} status - The outcome status of the action
 */
export async function logActivity(action, details = {}, status = 'info') {
    try {
        const { db } = await connectToDatabase();
        
        await db.collection('activity_logs').insertOne({
            action,
            details,
            status,
            created_at: new Date()
        });
    } catch (error) {
        // We log locally but don't throw to prevent interrupting main user flows
        console.error(`[Activity Logger] Failed to log action '${action}':`, error.message);
    }
}
