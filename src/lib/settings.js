import pool from '@/lib/db';

export async function getSettings() {
    const defaultSettings = {
        business_name: 'Car Recovery UK',
        phone: '07360544819',
        whatsapp: '447360544819',
        email: 'info@carrecoveryuk.co.uk',
        address: 'West Midlands, UK'
    };

    try {
        const [rows] = await pool.execute('SELECT setting_key, setting_value FROM settings');
        const settings = { ...defaultSettings };

        rows.forEach(row => {
            if (row.setting_value) {
                settings[row.setting_key] = row.setting_value;
            }
        });

        return settings;
    } catch (error) {
        console.error('Database error fetching settings:', error.message || error);
        console.error('Database config - Host: %s, User: %s, Database: %s', 
            process.env.DB_HOST || 'localhost',
            process.env.DB_USER || 'root',
            process.env.DB_NAME || 'carrecoverynw'
        );
        return defaultSettings;
    }
}
