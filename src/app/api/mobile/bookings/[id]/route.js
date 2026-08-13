// PATCH /api/mobile/bookings/:id — partially update a booking.
//
// A patch, not a replace: only the fields present in the body are touched.
// Sending an explicit null clears a field; omitting it leaves the stored value
// alone. Those are deliberately different — staff need to be able to clear a
// wrong dropoff address, without an app that edits one field wiping the rest.
//
// Deletes are intentionally not offered. `status: "cancelled"` covers the real
// case and keeps the record; a mis-tap on a phone is far easier than on a
// desktop, and a cancelled booking is recoverable where a deleted one is not.
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/db';
import { guard, fail, json, preflight } from '@/lib/mobileApi';
import {
    serializeBooking,
    parseStatusInput,
    resolveWebsiteStatus,
    EDITABLE_TEXT_FIELDS,
} from '@/lib/bookingSerializer';

export const dynamic = 'force-dynamic';

/**
 * Find which spelling of a field the caller used.
 *
 * Distinguishes "absent" from "present and null", which is the whole point of
 * a patch. Returns null when the caller didn't mention the field at all.
 */
function readField(body, aliases) {
    for (const alias of aliases) {
        if (Object.prototype.hasOwnProperty.call(body, alias)) {
            return { key: alias, value: body[alias] };
        }
    }
    return null;
}

/** Empty string and null both mean "clear this field". */
function normalizeText(value) {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text === '' ? null : text;
}

export async function OPTIONS() {
    return preflight();
}

export async function PATCH(request, { params }) {
    const denied = await guard(request, 'write');
    if (denied) return denied;

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
        return fail('No booking found with that id.', 404);
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return fail('The request body must be valid JSON.', 400);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return fail('The request body must be a JSON object.', 400);
    }

    const updates = {};

    // --- plain text fields ---------------------------------------------------
    for (const { column, aliases } of EDITABLE_TEXT_FIELDS) {
        const field = readField(body, aliases);
        if (field) updates[column] = normalizeText(field.value);
    }

    // --- total ---------------------------------------------------------------
    const totalField = readField(body, ['total', 'price']);
    if (totalField) {
        if (totalField.value === null || totalField.value === '') {
            updates.price = null;               // explicit "clear the price"
        } else {
            const parsed = Number(totalField.value);
            if (Number.isNaN(parsed) || parsed < 0) {
                return fail('The total must be a positive number, without a currency symbol.', 400);
            }
            updates.price = parsed;
        }
    }

    // --- scheduled_at --------------------------------------------------------
    const scheduledField = readField(body, ['scheduled_at', 'scheduledAt']);
    if (scheduledField) {
        if (scheduledField.value === null || scheduledField.value === '') {
            updates.scheduledAt = null;
        } else {
            const parsed = new Date(scheduledField.value);
            if (Number.isNaN(parsed.getTime())) {
                return fail('The requested date and time could not be understood. Use a format like 2026-09-14T14:00:00Z.', 400);
            }
            updates.scheduledAt = parsed;
        }
    }

    // --- status --------------------------------------------------------------
    // Resolved against the stored value below, since keeping a more specific
    // website status depends on what is already there.
    const statusField = readField(body, ['status']);
    let requestedStatus = null;
    if (statusField) {
        requestedStatus = parseStatusInput(statusField.value);
        if (!requestedStatus) {
            return fail('Status must be one of: pending, confirmed, completed, cancelled.', 400);
        }
    }

    if (Object.keys(updates).length === 0 && !requestedStatus) {
        return fail('No changes were sent.', 400);
    }

    // --- optimistic concurrency ---------------------------------------------
    // Optional: supply If-Unmodified-Since, or updated_at in the body, and the
    // update is rejected if someone else changed the record in the meantime.
    // Without either, last write wins.
    const ifUnmodifiedSince = request.headers.get('if-unmodified-since');
    const bodyUpdatedAt = typeof body.updated_at === 'string' ? body.updated_at : null;

    let precondition = null;
    if (bodyUpdatedAt || ifUnmodifiedSince) {
        const raw = bodyUpdatedAt || ifUnmodifiedSince;
        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) {
            return fail('The If-Unmodified-Since value could not be understood.', 400);
        }
        precondition = {
            at: parsed,
            // HTTP dates carry only whole seconds, so compare at that
            // resolution or a record saved mid-second looks falsely stale.
            wholeSecondsOnly: !bodyUpdatedAt,
        };
    }

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection('bookings');
        const objectId = new ObjectId(id);

        const existing = await collection.findOne({ _id: objectId });
        if (!existing) {
            return fail('No booking found with that id.', 404);
        }

        if (precondition && existing.updated_at) {
            const stored = new Date(existing.updated_at).getTime();
            const supplied = precondition.at.getTime();
            const changed = precondition.wholeSecondsOnly
                ? Math.floor(stored / 1000) > Math.floor(supplied / 1000)
                : stored > supplied;

            if (changed) {
                return json(
                    { message: 'Someone else updated this booking first. Reload it and try again.' },
                    409
                );
            }
        }

        if (requestedStatus) {
            updates.status = requestedStatus.kind === 'website'
                ? requestedStatus.value
                : resolveWebsiteStatus(existing.status, requestedStatus.value);
        }

        // Guard the write on the value we just read, so a change landing
        // between the check and the write is caught rather than overwritten.
        const filter = precondition
            ? { _id: objectId, updated_at: existing.updated_at }
            : { _id: objectId };

        const result = await collection.findOneAndUpdate(
            filter,
            { $set: { ...updates, updated_at: new Date() } },
            { returnDocument: 'after' }
        );

        // Driver versions differ on whether the document is wrapped in `value`.
        const updated = result?.value ?? result;

        if (!updated) {
            // The id existed a moment ago, so a miss here means the guarded
            // filter didn't match — someone wrote in between.
            return json(
                { message: 'Someone else updated this booking first. Reload it and try again.' },
                409
            );
        }

        return json(serializeBooking(updated));
    } catch (error) {
        console.error('[Mobile API] PATCH /bookings failed:', error);
        return fail('Could not update the booking right now. Please try again.', 500);
    }
}
