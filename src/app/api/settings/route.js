import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import { getAdminSession, requireAdmin } from '@/lib/adminSession';

export const dynamic = 'force-dynamic';

// Mail settings are admin-only. The password is never sent back to any browser.
const PRIVATE_PREFIX = 'smtp_';
const PRIVATE_KEYS = new Set(['booking_email']);
const isPrivate = (key) => key.startsWith(PRIVATE_PREFIX) || PRIVATE_KEYS.has(key);

// GET all settings
export async function GET(request) {
    try {
        const { db } = await connectToDatabase();
        const rows = await db.collection('settings').find({}).toArray();
        const isAdmin = !!(await getAdminSession(request));
        const settings = {};
        let passSet = false;
        rows.forEach(row => {
            if (row.setting_key === 'smtp_pass') {
                passSet = !!row.setting_value;
                return;
            }
            if (isPrivate(row.setting_key) && !isAdmin) return;
            settings[row.setting_key] = row.setting_value;
        });
        if (isAdmin) settings.smtp_pass_set = passSet;
        return NextResponse.json({ success: true, data: settings });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// Invisible Unicode format characters (bidi marks, zero-width spaces, BOM) that
// ride along when a phone number is copied from iOS Contacts or WhatsApp.
const INVISIBLE_CHARS = /[​-‏‪-‮⁠-⁯﻿]/g;

function sanitizeValue(key, value) {
    if (typeof value !== 'string') return value;
    const clean = value.replace(INVISIBLE_CHARS, '').trim();
    // wa.me links accept digits only — no "+", spaces, or dashes.
    if (key === 'whatsapp') return clean.replace(/\D/g, '');
    return clean;
}

// PUT update settings
export async function PUT(request) {
    const auth = await requireAdmin(request);
    if (!auth.ok) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        const body = await request.json();
        const { db } = await connectToDatabase();
        const settingsCollection = db.collection('settings');

        const entries = Object.entries(body).filter(([key, value]) => {
            if (key === 'smtp_pass_set') return false;
            // A blank password field means "keep the saved one".
            if (key === 'smtp_pass' && !String(value || '').trim()) return false;
            return true;
        });

        const bulkOps = entries.map(([key, value]) => ({
            updateOne: {
                filter: { setting_key: key },
                update: { $set: { setting_key: key, setting_value: sanitizeValue(key, value) } },
                upsert: true
            }
        }));

        if (bulkOps.length > 0) {
            await settingsCollection.bulkWrite(bulkOps);
        }

        // Phone, WhatsApp and business details are baked into cached pages
        // (home, every area page, header and footer), so refresh them all.
        revalidatePath('/', 'layout');

        return NextResponse.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
