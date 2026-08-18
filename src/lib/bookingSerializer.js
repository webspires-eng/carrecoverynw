// Translation between the website's booking record and the app's payload.
//
// Shared by GET/POST /api/mobile/bookings and PATCH /api/mobile/bookings/:id,
// so the shape the app reads and the shape it writes can never drift apart.

// This site is a UK vehicle recovery business — all prices are pounds.
export const CURRENCY = 'GBP';

// The website tracks a richer job lifecycle than the app understands, so map
// onto the four statuses the app supports. The original value is still
// returned as `website_status` for anything that wants the real state.
export const STATUS_MAP = {
    new: 'pending',
    confirmed: 'confirmed',
    dispatched: 'confirmed',   // job accepted, driver on the way
    completed: 'completed',
    cancelled: 'cancelled',
    lost: 'cancelled',         // enquiry that never converted
};

// Default target when the current status doesn't already mean the same thing.
const REVERSE_STATUS_MAP = {
    pending: 'new',
    confirmed: 'confirmed',
    completed: 'completed',
    cancelled: 'cancelled',
};

// Spellings the app may use for the four statuses.
const STATUS_ALIASES = {
    canceled: 'cancelled',
    approved: 'confirmed',
    done: 'completed',
};

// Website-only values, accepted so a client that knows the real lifecycle can
// set them exactly. These are applied verbatim — no collapsing.
const WEBSITE_ONLY_STATUSES = ['new', 'dispatched', 'lost'];

export function toIso(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function toNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
}

/**
 * Interpret a status the caller sent.
 *
 * @returns {{ kind: 'app'|'website', value: string } | null} null if unknown.
 */
export function parseStatusInput(raw) {
    const value = String(raw ?? '').trim().toLowerCase();
    if (!value) return null;

    if (WEBSITE_ONLY_STATUSES.includes(value)) {
        return { kind: 'website', value };
    }

    const canonical = STATUS_ALIASES[value] || value;
    if (REVERSE_STATUS_MAP[canonical]) {
        return { kind: 'app', value: canonical };
    }

    return null;
}

/**
 * Work out what to store when the app asks for `requested`.
 *
 * If the current website status already collapses to the status being asked
 * for, keep it — the website holds the more specific truth. That's what stops
 * an app sending "confirmed" from silently un-dispatching a driver, or turning
 * a `lost` enquiry into a plain `cancelled` one.
 */
export function resolveWebsiteStatus(current, requested) {
    if (current && STATUS_MAP[current] === requested) return current;
    return REVERSE_STATUS_MAP[requested];
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
export function serializeBooking(row) {
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
        // 'yes' | 'no' | null — null means nobody has asked yet.
        is_rolling: row.isRolling || null,
        passengers: row.passengers ?? null,

        source: row.source || 'website',
        created_at: toIso(row.created_at),
        updated_at: toIso(row.updated_at),
    };
}

/**
 * Text fields the app may edit, mapped to their column in the database.
 * Each entry lists every spelling accepted on input.
 */
export const IS_ROLLING_ALIASES = ['is_rolling', 'isRolling', 'rolling'];

/**
 * Read a rolling answer the app sent.
 *
 * @returns {{ ok: true, value: 'yes'|'no'|null } | { ok: false }}
 */
export function parseIsRolling(raw) {
    if (raw === null || raw === undefined || raw === '') return { ok: true, value: null };
    if (raw === true) return { ok: true, value: 'yes' };
    if (raw === false) return { ok: true, value: 'no' };
    const value = String(raw).trim().toLowerCase();
    if (value === 'yes' || value === 'no') return { ok: true, value };
    return { ok: false };
}

/**
 * How many people need moving with the vehicle — a recovery truck has a fixed
 * number of cab seats, so this decides whether one truck can take the job.
 *
 * @returns {{ ok: true, value: number|null } | { ok: false }}
 */
export function parsePassengers(raw) {
    if (raw === null || raw === undefined || raw === '') return { ok: true, value: null };
    const num = Number(raw);
    if (!Number.isInteger(num) || num < 0 || num > 99) return { ok: false };
    return { ok: true, value: num };
}

export const EDITABLE_TEXT_FIELDS = [
    { column: 'name', aliases: ['customer_name', 'customerName', 'name'] },
    { column: 'phone', aliases: ['customer_phone', 'customerPhone', 'phone'] },
    { column: 'email', aliases: ['customer_email', 'customerEmail', 'email'] },
    { column: 'serviceType', aliases: ['service_name', 'serviceName', 'serviceType', 'service_type'] },
    { column: 'pickupLocation', aliases: ['pickup_location', 'pickupLocation', 'pickup'] },
    { column: 'dropoffLocation', aliases: ['dropoff_location', 'dropoffLocation', 'dropoff'] },
    { column: 'registrationNumber', aliases: ['registration_number', 'registrationNumber', 'registration'] },
    { column: 'vehicleMake', aliases: ['vehicle_make', 'vehicleMake'] },
    { column: 'vehicleModel', aliases: ['vehicle_model', 'vehicleModel'] },
    { column: 'message', aliases: ['notes', 'message'] },
];
