import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

// GET all settings
export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const rows = await db.collection('settings').find({}).toArray();
        const settings = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        return NextResponse.json({ success: true, data: settings });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// Invisible Unicode format characters (bidi marks, zero-width spaces, BOM) that
// ride along when a phone number is copied from iOS Contacts or WhatsApp.
const INVISIBLE_CHARS = /[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g;

function sanitizeValue(key, value) {
    if (typeof value !== 'string') return value;
    const clean = value.replace(INVISIBLE_CHARS, '').trim();
    // wa.me links accept digits only — no "+", spaces, or dashes.
    if (key === 'whatsapp') return clean.replace(/\D/g, '');
    return clean;
}

// PUT update settings
export async function PUT(request) {
    try {
        const body = await request.json();
        const { db } = await connectToDatabase();
        const settingsCollection = db.collection('settings');

        const bulkOps = Object.entries(body).map(([key, value]) => ({
            updateOne: {
                filter: { setting_key: key },
                update: { $set: { setting_key: key, setting_value: sanitizeValue(key, value) } },
                upsert: true
            }
        }));

        if (bulkOps.length > 0) {
            await settingsCollection.bulkWrite(bulkOps);
        }

        return NextResponse.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
