import pool from './db.js';

async function migrate() {
    try {
        console.log('Adding UNIQUE constraint to name column in areas table...');

        // Check if there are already duplicate names
        const [duplicates] = await pool.execute(`
            SELECT name, COUNT(*) as count 
            FROM areas 
            GROUP BY name 
            HAVING count > 1
        `);

        if (duplicates.length > 0) {
            console.error('Cannot add UNIQUE constraint: Duplicate names found in areas table:', duplicates);
            process.exit(1);
        }

        await pool.execute('ALTER TABLE areas ADD UNIQUE (name)');
        console.log('UNIQUE constraint added successfully.');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_KEY' || error.errno === 1061) {
            console.log('UNIQUE constraint already exists or name index exists.');
            process.exit(0);
        }
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
