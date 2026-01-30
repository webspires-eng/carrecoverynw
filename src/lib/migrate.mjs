import pool from './db.js';

async function migrate() {
    try {
        console.log('Adding custom_recoveries column to areas table...');
        await pool.execute('ALTER TABLE areas ADD COLUMN IF NOT EXISTS custom_recoveries TEXT;');
        console.log('Migration completed successfully!');
    } catch (error) {
        // If IF NOT EXISTS is not supported, it might fail if column exists.
        console.error('Migration failed or column already exists:', error.message);
    } finally {
        process.exit();
    }
}

migrate();
