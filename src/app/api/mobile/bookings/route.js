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
import { connectToDatabase } from '@/lib/db';
import { sendBookingEmail } from '@/lib/email';
import { guard, fail, json, preflight } from '@/lib/mobileApi';
import { serializeBooking, toNumber } from '@/lib/bookingSerializer';

export const dynamic = 'force-dynamic';   // never cache customer data

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

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

export async function OPTIONS() {
    return preflight();
}

// GET — list bookings, newest first.
export async function GET(request) {
    const denied = await guard(request, 'read');
    if (denied) return denied;

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

        return json({ data: rows.map(serializeBooking), count: rows.length, limit });
    } catch (error) {
        console.error('[Mobile API] GET /bookings failed:', error);
        return fail('Could not load bookings right now. Please try again.', 500);
    }
}

// POST — create a booking.
export async function POST(request) {
    const denied = await guard(request, 'write');
    if (denied) return denied;

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
        return json(serializeBooking({ ...doc, _id: result.insertedId }), 201);
    } catch (error) {
        console.error('[Mobile API] POST /bookings failed:', error);
        return fail('Could not create the booking right now. Please try again.', 500);
    }
}
