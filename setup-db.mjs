import pool from './src/lib/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function setupDatabase() {
    try {
        console.log('Dropping existing tables...');
        await pool.execute('DROP TABLE IF EXISTS recoveries');
        await pool.execute('DROP TABLE IF EXISTS services');
        await pool.execute('DROP TABLE IF EXISTS settings');
        await pool.execute('DROP TABLE IF EXISTS areas');
        console.log('✓ Tables dropped');

        console.log('Reading schema file...');
        const schemaPath = path.join(__dirname, 'src/lib/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema...');
        // Split by semicolon and execute each statement
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await pool.execute(statement.trim());
            }
        }

        console.log('✅ Database setup completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        process.exit(1);
    }
}

setupDatabase();
