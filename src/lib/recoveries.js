import pool from '@/lib/db';

export async function getRecoveries() {
    try {
        const [rows] = await pool.execute('SELECT * FROM recoveries WHERE is_active = TRUE ORDER BY display_order ASC');
        return rows;
    } catch (error) {
        console.error('Database error fetching recoveries:', error);
        return [];
    }
}
