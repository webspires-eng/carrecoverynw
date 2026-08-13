// Public booking API for the mobile app.
//
//   GET  /api/mobile/bookings   list bookings, newest first
//   POST /api/mobile/bookings   create a booking
//
// Auth: X-API-Key: <key>   (or Authorization: Bearer <key>)
//
// This is a translation layer, not a second source of truth. It reads and
// writes the same `bookings` collection the website form and the admin
// dashboard use; it only renames fields into the shape the app expects.
// The internal field names (name/phone/serviceType/price/message) are kept
// alongside the app-facing ones so nothing is lost in translation.
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { sendBookingEmail } from '@/lib/email';
import { verifyApiKey } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';   // never cache customer data

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

// This site is a UK vehicle recovery business — all prices are pounds.
const CURRENCY = 'GBP';

// The website tracks a richer job lifecycle than the app understands, so
// map onto the four statuses the app supports. The original value is still
// returned as `website_status` for anything that wants the real state.
const STATUS_MAP = {
    new: 'pending',
    confirmed: 'confirmed',
    dispatched: 'confirmed',   // job accepted, driver on the way
    completed: 'completed',
    cancelled: 'cancelled',
    lost: 'cancelled',         // enquiry that never converted
};

// Native apps don't enforce CORS, but a webview/Expo-web build does.
// Safe to allow broadly: auth is a header key, not a cookie.
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
    'Access-Control-Max-Age': '86400',
};

function json(body, status = 200) {
    return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

/** Human-readable error, in the shape the app displays to the user. */
function fail(message, status) {
    return json({ message }, status);
}

function toIso(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
}

/** First non-empty value among the accepted spellings of a field. */
function pick(body, ...keys) {
    for (const key of keys) {
        const value = body[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            return String(value).trim();
        }
    }
    return null;
}

/**
 * Map a stored booking onto the app's payload.
 *
 * `scheduled_at` needs a note: this business is on-demand recovery, so most
 * bookings have no appointment time — the job is "now". Bookings created
 * through the app can carry a requested time (`scheduledAt`); everything
 * else falls back to when the booking was placed, so the field is always
 * present and always a real timestamp.
 */
function serialize(row) {
    return {
        id: row._id.toString(),

        service_name: row.serviceType || null,
        scheduled_at: toIso(row.scheduledAt || row.created_at),
        status: STATUS_MAP[row.status] || 'pending',
        website_status: row.status || 'new',

        customer_name: row.name || null,
        customer_email: row.email || null,
        customer_phone: row.phone || null,

        total: toNumber(row.price),
        currency: CURRENCY,
        notes: row.message || null,

        // Recovery-specific fields with no equivalent in the app's spec.
        // Send them through anyway — the pickup location is the single most
        // important field on a recovery job.
        pickup_location: row.pickupLocation || null,
        dropoff_location: row.dropoffLocation || null,
        registration_number: row.registrationNumber || null,
        vehicle_make: row.vehicleMake || null,
        vehicle_model: row.vehicleModel || null,

        source: row.source || 'website',
        created_at: toIso(row.created_at),
        updated_at: toIso(row.updated_at),
    };
}

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// GET — list bookings, newest first.
export async function GET(request) {
    const auth = verifyApiKey(request);
    if (!auth.ok) return fail(auth.message, auth.status);

    try {
        const { searchParams } = new URL(request.url);

        // No cursor paging: this business has a few thousand bookings at most
        // and the app only wants recent ones. `limit` is enough.
        const requested = parseInt(searchParams.get('limit'), 10);
        const limit = Number.isNaN(requested)
            ? DEFAULT_LIMIT
            : Math.min(Math.max(requested, 1), MAX_LIMIT);

        const { db } = await connectToDatabase();
        const rows = await db.collection('bookings')
            .find({})
            .sort({ created_at: -1 })
            .limit(limit)
            .toArray();

        return json({ data: rows.map(serialize), count: rows.length, limit });
    } catch (error) {
        console.error('[Mobile API] GET /bookings failed:', error);
        return fail('Could not load bookings right now. Please try again.', 500);
    }
}

// POST — create a booking.
export async function POST(request) {
    const auth = verifyApiKey(request);
    if (!auth.ok) return fail(auth.message, auth.status);

    let body;
    try {
        body = await request.json();
    } catch {
        return fail('The request body must be valid JSON.', 400);
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return fail('The request body must be a JSON object.', 400);
    }

    try {
        // Accept snake_case, camelCase, and the website's own field names,
        // so the app doesn't have to care which convention it sends.
        const name = pick(body, 'customer_name', 'customerName', 'name');
        const phone = pick(body, 'customer_phone', 'customerPhone', 'phone');
        const email = pick(body, 'customer_email', 'customerEmail', 'email');
        const serviceType = pick(body, 'service_name', 'serviceName', 'serviceType', 'service_type');
        const pickupLocation = pick(body, 'pickup_location', 'pickupLocation', 'pickup');
        const dropoffLocation = pick(body, 'dropoff_location', 'dropoffLocation', 'dropoff');
        const registrationNumber = pick(body, 'registration_number', 'registrationNumber', 'registration');
        const vehicleMake = pick(body, 'vehicle_make', 'vehicleMake');
        const vehicleModel = pick(body, 'vehicle_model', 'vehicleModel');
        const message = pick(body, 'notes', 'message');
        const scheduledAtRaw = pick(body, 'scheduled_at', 'scheduledAt');
        const totalRaw = body.total ?? body.price ?? null;

        // Same required set as the website's own booking form, so the app
        // can't create a job the office is unable to action.
        const missing = [];
        if (!name) missing.push('customer name');
        if (!phone) missing.push('phone number');
        if (!pickupLocation) missing.push('pickup location');
        if (!serviceType) missing.push('service');
        if (missing.length) {
            return fail(`Please provide the ${missing.join(', ')}.`, 400);
        }

        let scheduledAt = null;
        if (scheduledAtRaw) {
            const parsed = new Date(scheduledAtRaw);
            if (Number.isNaN(parsed.getTime())) {
                return fail('The requested date and time could not be understood. Use a format like 2026-09-14T14:00:00Z.', 400);
            }
            scheduledAt = parsed;
        }

        const total = toNumber(totalRaw);
        if (totalRaw !== null && totalRaw !== undefined && totalRaw !== '' && (total === null || total < 0)) {
            return fail('The total must be a positive number, without a currency symbol.', 400);
        }

        const now = new Date();
        const doc = {
            name,
            phone,
            email: email || null,
            pickupLocation,
            dropoffLocation: dropoffLocation || null,
            serviceType,
            registrationNumber: registrationNumber || null,
            vehicleMake: vehicleMake || null,
            vehicleModel: vehicleModel || null,
            message: message || null,
            scheduledAt,
            status: 'new',
            source: 'mobile-app',
            price: total,
            created_at: now,
            updated_at: now,
        };

        const { db } = await connectToDatabase();
        const result = await db.collection('bookings').insertOne(doc);

        // Same notification the website form sends — a booking from the app
        // is a real job the office needs to see. Fire-and-forget: a mail
        // failure must not fail the booking.
        sendBookingEmail({
            name, phone, email, pickupLocation, dropoffLocation, serviceType,
            registrationNumber, vehicleMake, vehicleModel, message,
        }).catch(err => {
            console.error('[Mobile API] Email notification failed:', err.message);
        });

        // Return the created booking, including its id, so the app can show
        // it immediately and recognise it on the next sync.
        return json(serialize({ ...doc, _id: result.insertedId }), 201);
    } catch (error) {
        console.error('[Mobile API] POST /bookings failed:', error);
        return fail('Could not create the booking right now. Please try again.', 500);
    }
}
