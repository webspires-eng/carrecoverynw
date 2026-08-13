// Push notification to the office phones when a lead lands.
//
// Two hops, no credentials of our own:
//   1. Read the enabled device tokens from Supabase, where the mobile app
//      registers each phone (anon key — the same key that ships in the app).
//   2. Hand those tokens to Expo's push service, which does the talking to
//      Apple and Google.
//
// Nothing in here throws. A booking must never fail because an alert didn't
// send, so every failure is logged and swallowed — same contract as
// sendBookingEmail in ./email.js.
//
// Payloads pass through Apple's and Google's infrastructure and land on locked
// screens, so the message carries the customer's name and pickup location and
// nothing more — no phone number, no email, no notes.

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qivhphowvipfuoxwiwly.supabase.co';
const DEVICE_TOKENS_URL = `${SUPABASE_URL}/rest/v1/device_tokens`;
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Expo accepts up to 100 messages per request. This business will never have
// 100 phones, but one request per batch beats one request per device.
const BATCH_SIZE = 100;

// A hanging upstream must not hold a serverless function open until the
// platform kills it.
const TIMEOUT_MS = 8000;

function supabaseHeaders(key) {
    return { apikey: key, Authorization: `Bearer ${key}` };
}

/** Tokens of every phone that still wants alerts, de-duplicated. */
async function fetchEnabledTokens(key) {
    const response = await fetch(`${DEVICE_TOKENS_URL}?select=token&enabled=eq.true`, {
        headers: supabaseHeaders(key),
        signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
        throw new Error(`Supabase returned ${response.status} reading device_tokens`);
    }

    const rows = await response.json();
    if (!Array.isArray(rows)) return [];

    // A phone that registered twice would otherwise be notified twice.
    return [...new Set(rows.map(row => row?.token).filter(Boolean))];
}

/**
 * Mute a token Expo has told us is dead — the app was uninstalled, or the
 * phone was reset and issued a new token. Without this we'd push to it forever.
 */
async function disableToken(key, token) {
    const response = await fetch(`${DEVICE_TOKENS_URL}?token=eq.${encodeURIComponent(token)}`, {
        method: 'PATCH',
        headers: { ...supabaseHeaders(key), 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
        throw new Error(`Supabase returned ${response.status} disabling a token`);
    }
}

/**
 * The notification as it appears on a lock screen: service in the title,
 * who and where in the body — the three things worth knowing at a glance.
 */
function buildMessage(booking, token) {
    const body = [booking.name, booking.pickupLocation].filter(Boolean).join(' · ');

    return {
        to: token,
        title: `New booking — ${booking.serviceType || 'Recovery request'}`,
        body: body || 'New enquiry — open the app for details',
        sound: 'default',
        // Required on Android: without it the notification is silent and unranked.
        channelId: 'leads',
        priority: 'high',
        // The id GET /bookings returns, so tapping the alert opens this booking
        // rather than dumping the user on the home screen to go hunting.
        data: { bookingId: booking.id },
    };
}

/**
 * Send one batch and read the receipts back.
 *
 * Expo answers with one receipt per message, in the order they were sent, so
 * a receipt is matched to its token by position.
 *
 * @returns {Promise<{ sent: number, dead: string[] }>}
 */
async function sendBatch(messages) {
    const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages),
        signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
        throw new Error(`Expo returned ${response.status}`);
    }

    const payload = await response.json();

    // Request-level rejection: nothing in this batch was delivered.
    if (payload?.errors?.length) {
        throw new Error(payload.errors.map(e => e.message).join('; '));
    }

    const receipts = Array.isArray(payload?.data) ? payload.data : [];
    const dead = [];
    let sent = 0;

    receipts.forEach((receipt, index) => {
        if (receipt?.status === 'ok') {
            sent += 1;
            return;
        }

        const token = messages[index]?.to;
        if (receipt?.details?.error === 'DeviceNotRegistered') {
            dead.push(token);
        } else {
            // Anything else — rate limits, a malformed token, an Expo outage —
            // is worth knowing about but not worth acting on.
            console.error('[Push] Expo rejected a message:', receipt?.message || 'unknown error');
        }
    });

    return { sent, dead };
}

/**
 * Alert the office that a booking has landed.
 *
 * Never throws and never rejects: callers can fire this without a catch and
 * the booking is safe either way.
 *
 * @param {object} booking Needs `id` (the booking's id, as GET /bookings
 *        returns it), plus `serviceType`, `name` and `pickupLocation` for the
 *        text of the notification.
 * @returns {Promise<{ ok: boolean, sent?: number, error?: string }>}
 */
export async function sendBookingPush(booking) {
    const key = process.env.SUPABASE_ANON_KEY;

    if (!key) {
        console.error('[Push] Missing SUPABASE_ANON_KEY env var — no notification sent');
        return { ok: false, error: 'Missing SUPABASE_ANON_KEY' };
    }

    try {
        const tokens = await fetchEnabledTokens(key);
        if (!tokens.length) {
            console.log('[Push] No devices are registered for alerts');
            return { ok: true, sent: 0 };
        }

        const dead = [];
        let sent = 0;

        for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
            const batch = tokens.slice(i, i + BATCH_SIZE);
            const result = await sendBatch(batch.map(token => buildMessage(booking, token)));
            sent += result.sent;
            dead.push(...result.dead);
        }

        if (dead.length) {
            // Best effort — a token we fail to mute is only a wasted message
            // next time, so it must not turn a delivered batch into a failure.
            const muted = await Promise.allSettled(dead.map(token => disableToken(key, token)));
            const failed = muted.filter(r => r.status === 'rejected').length;
            console.log(`[Push] Disabled ${dead.length - failed} unregistered device(s)`);
            if (failed) console.error(`[Push] Could not disable ${failed} unregistered device(s)`);
        }

        console.log(`[Push] Booking alert sent to ${sent}/${tokens.length} device(s)`);
        return { ok: true, sent };
    } catch (error) {
        console.error('[Push] Failed to send booking notification:', error.message);
        return { ok: false, error: error.message };
    }
}
