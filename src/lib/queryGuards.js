// Guards for values that come from a URL and end up in a MongoDB query.
//
// Every list endpoint used to pass `?limit=` and `?search=` straight through:
// limit=100000 made the server load a whole collection into memory, and a
// search of "(" threw inside `new RegExp` (a 500) while a crafted pattern
// could pin the CPU. These helpers put a ceiling on both.
//
// No imports on purpose: this file is unit-tested with plain `node --test`.

// Largest page a list endpoint will return, whatever the caller asks for.
// The admin "View All" option asks for 1000, so that is the default ceiling.
export const MAX_PAGE_SIZE = 1000;

// Longest search text accepted; anything beyond is cut off.
export const MAX_SEARCH_LENGTH = 80;

/** Whole number from user input, forced into [min, max]; fallback if unreadable. */
export function clampInt(value, { min, max, fallback }) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(Math.max(parsed, min), max);
}

/**
 * Read ?page= and ?limit= safely.
 * @returns {{ page: number, limit: number, offset: number }}
 */
export function parsePaging(searchParams, { defaultLimit = 25, maxLimit = MAX_PAGE_SIZE } = {}) {
    const page = clampInt(searchParams.get('page'), { min: 1, max: 100000, fallback: 1 });
    const limit = clampInt(searchParams.get('limit'), { min: 1, max: maxLimit, fallback: defaultLimit });
    return { page, limit, offset: (page - 1) * limit };
}

/** Escape regex metacharacters so user text is matched literally. */
export function escapeRegex(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Case-insensitive "contains" matcher for user-typed search text,
 * or null when there is nothing to search for.
 */
export function searchRegex(text) {
    const trimmed = String(text ?? '').trim().slice(0, MAX_SEARCH_LENGTH);
    if (!trimmed) return null;
    return new RegExp(escapeRegex(trimmed), 'i');
}
