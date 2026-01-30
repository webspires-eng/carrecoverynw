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

    // 4. Create and populate the Recoveries table
    const recoveriesSchema = `
    CREATE TABLE IF NOT EXISTS recoveries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(255) NOT NULL,
        location_text VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status_text VARCHAR(255) NOT NULL,
        icon_name VARCHAR(50) DEFAULT 'Truck',
        color_theme VARCHAR(50) DEFAULT 'blue',
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    `;
    console.log('Executing recoveries schema...');
    await connection.query(recoveriesSchema);

    // Check if recoveries exist before inserting
    const [recoveryRows] = await connection.query('SELECT COUNT(*) as count FROM recoveries');
    if (recoveryRows[0].count === 0) {
        console.log('Inserting default recoveries...');
        const insertRecoveries = `
        INSERT INTO recoveries (type, location_text, description, status_text, icon_name, color_theme, display_order) VALUES
        ('Flat Battery', 'Birmingham City Centre', 'Jump start provided for a stranded driver in a multi-storey car park. Recovery to local garage completed within 45 mins.', 'Updates via WhatsApp', 'Battery', 'yellow', 1),
        ('Low Clearance', 'Coventry', 'Specialized flatbed recovery for a sports car with low ground clearance. Damage-free loading guaranteed.', 'Secure Transport', 'Car', 'blue', 2),
        ('Motorway Breakdown', 'M6 (Junction 6)', 'Emergency recovery from a live lane on the M6. Location pin confirmed and truck dispatched immediately.', 'Safe Destination', 'Route', 'orange', 3),
        ('Locked Wheels', 'Wolverhampton', 'Recovered a vehicle with seized brakes using specialized skates. Professional handling from start to finish.', 'Damage-Free', 'Lock', 'green', 4),
        ('Accident Recovery', 'Walsall', 'Post-accident vehicle recovery to a secure storage facility. Coordinated with emergency services.', '24/7 Response', 'TriangleAlert', 'red', 5),
        ('Transport', 'Solihull to London', 'Pre-booked vehicle transportation for a classic car. Door-to-door service with full insurance coverage.', 'Pre-booked', 'Truck', 'purple', 6);
        `;
        await connection.query(insertRecoveries);
    }

    console.log('Database seeded successfully!');
    await connection.end();
}

seed().catch(err => {
    console.error('Seeding failed:', err);
    console.error('Ensure your MySQL server is running and the database "carrecoverynw" exists.');
    process.exit(1);
});
