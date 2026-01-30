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

    // 3. Create and populate the Services table
    const servicesSchema = `
    CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        icon_name VARCHAR(50) DEFAULT 'CircleCheck',
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    `;
    console.log('Executing services schema...');
    await connection.query(servicesSchema);

    // Check if services exist before inserting
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM services');
    if (rows[0].count === 0) {
        console.log('Inserting default services...');
        const insertServices = `
        INSERT INTO services (title, description, display_order) VALUES
        ('Emergency Breakdown Recovery', 'Available 24/7, our emergency recovery team handles breakdowns, accidents, and roadside issues across {{location}} & outskirts.', 1),
        ('Roadside Assistance', 'Quick fixes for flat tyres, jump starts, and minor mechanical issues to get you moving again fast.', 2),
        ('Vehicle Transportation', 'Safe, fully insured door-to-door transport for cars, vans, and motorcycles locally or nationwide.', 3),
        ('Jump Start Service', 'Fast battery revival service available 24/7. We\\'ll get you started or recover you to a garage.', 4),
        ('Low Vehicle Recovery', 'Specialist flatbed trucks and ramps for sports cars, lowered vehicles, and luxury cars — damage-free guaranteed.', 5),
        ('Motorway Recovery ({{majorRoads}})', 'Priority dispatch for motorway breakdowns. We understand the urgency and safety risks involved.', 6);
        `;
        await connection.query(insertServices);
    }

    console.log('Database seeded successfully!');
    await connection.end();
}

seed().catch(err => {
    console.error('Seeding failed:', err);
    console.error('Ensure your MySQL server is running and the database "carrecoverynw" exists.');
    process.exit(1);
});
