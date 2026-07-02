import { cache } from 'react';
import { connectToDatabase } from '@/lib/db';

// cache(): per-render-pass memoization. Several server components on a page
// call getSettings() independently; this dedupes them to one DB read per page
// render without introducing any staleness across requests.
export const getSettings = cache(async function getSettings() {
    const defaultSettings = {
        business_name: 'Car Recovery UK',
        phone: '07360544819',
        whatsapp: '447360544819',
        email: 'info@carrecoveryuk.co.uk',
        address: 'West Midlands, UK',
        favicon: '/truckicon.png'
    };

    try {
        const { db } = await connectToDatabase();
        const settingsCollection = db.collection('settings');

        const docs = await settingsCollection.find({}).toArray();
        const settings = { ...defaultSettings };

        docs.forEach(doc => {
            if (doc.setting_key && doc.setting_value) {
                settings[doc.setting_key] = doc.setting_value;
            }
        });

        return settings;
    } catch (error) {
        console.error('Database error fetching settings:', error.message || error);
        return defaultSettings;
    }
});
