import { createConnection } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
    console.log('Connecting to database...');
    // Note: Using the same default credentials as src/lib/db.js
    const connection = await createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'carrecoverynw',
        multipleStatements: true
    });

    console.log('Connected.');

    // 1. Run the existing schema.sql (Areas table)
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
        const existingSchema = fs.readFileSync(schemaPath, 'utf8');
        console.log('Executing schema.sql...');
        await connection.query(existingSchema);
    } else {
        console.warn('schema.sql not found, skipping areas table creation.');
    }

    // 2. Create and populate the missing Settings table
    const settingsSchema = `
    CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(255) PRIMARY KEY,
        setting_value TEXT
    );

    INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
    ('business_name', 'Car Recovery UK'),
    ('phone', '07360544819'),
    ('whatsapp', '447360544819'),
    ('email', 'info@carrecoveryuk.co.uk'),
    ('address', 'West Midlands, UK');
    `;

    console.log('Executing settings schema...');
    await connection.query(settingsSchema);

    console.log('Database seeded successfully!');
    await connection.end();
}

seed().catch(err => {
    console.error('Seeding failed:', err);
    console.error('Ensure your MySQL server is running and the database "carrecoverynw" exists.');
    process.exit(1);
});
