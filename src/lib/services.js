import pool from '@/lib/db';

export async function getServices() {
    try {
        const [rows] = await pool.execute('SELECT * FROM services WHERE is_active = TRUE ORDER BY display_order ASC');
        return rows;
    } catch (error) {
        console.error('Database error fetching services:', error);
        return [];
    }
}
