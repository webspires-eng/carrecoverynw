import { readFileSync } from 'fs';
import { sign } from 'crypto';

const INDEXING_API_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/indexing';

/**
 * Load the service account key.
 * Supports two modes:
 *   1. GOOGLE_INDEXING_KEY_JSON — inline JSON string (for Vercel / serverless)
 *   2. GOOGLE_INDEXING_KEY_PATH — file path (for local dev)
 */
function loadServiceAccountKey() {
    // Priority 1: inline JSON (works on Vercel)
    const keyJson = process.env.GOOGLE_INDEXING_KEY_JSON;
    if (keyJson) {
        try {
            return JSON.parse(keyJson);
        } catch (err) {
            throw new Error(`Failed to parse GOOGLE_INDEXING_KEY_JSON: ${err.message}`);
        }
    }

    // Priority 2: file path (works locally)
    const keyPath = process.env.GOOGLE_INDEXING_KEY_PATH;
    if (!keyPath) {
        throw new Error('Neither GOOGLE_INDEXING_KEY_JSON nor GOOGLE_INDEXING_KEY_PATH environment variable is set');
    }
    try {
        const raw = readFileSync(keyPath, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        throw new Error(`Failed to load service account key from ${keyPath}: ${err.message}`);
    }
}

/**
 * Create a signed JWT for Google OAuth2 service account authentication.
 */
function createSignedJWT(serviceAccount) {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
        iss: serviceAccount.client_email,
        scope: SCOPE,
        aud: TOKEN_URL,
        iat: now,
        exp: now + 3600, // 1 hour
    };

    const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const unsignedToken = `${encode(header)}.${encode(payload)}`;

    const signature = sign('RSA-SHA256', Buffer.from(unsignedToken), serviceAccount.private_key);
    return `${unsignedToken}.${signature.toString('base64url')}`;
}

/**
 * Get an access token from Google OAuth2 using service account credentials.
 */
let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
    // Return cached token if still valid (with 5 min buffer)
    if (cachedToken && Date.now() < tokenExpiry - 300000) {
        return cachedToken;
    }

    const serviceAccount = loadServiceAccountKey();
    const jwt = createSignedJWT(serviceAccount);

    const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to get access token: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);
    return cachedToken;
}

/**
 * Submit a URL to Google's Indexing API.
 *
 * @param {string} url - The full URL to submit (e.g. https://cartowingnearme.co.uk/area/birmingham)
 * @param {'URL_UPDATED' | 'URL_DELETED'} type - The notification type
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function submitUrlToGoogle(url, type = 'URL_UPDATED') {
    try {
        if (!url) {
            throw new Error('URL is required');
        }
        if (!['URL_UPDATED', 'URL_DELETED'].includes(type)) {
            throw new Error('Type must be URL_UPDATED or URL_DELETED');
        }

        const accessToken = await getAccessToken();

        const response = await fetch(INDEXING_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ url, type }),
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('[Google Indexing] Error response:', JSON.stringify(responseData));
            return {
                success: false,
                error: responseData.error?.message || `HTTP ${response.status}`,
                data: responseData,
            };
        }

        console.log(`[Google Indexing] Successfully submitted ${type} for: ${url}`);
        return { success: true, data: responseData };
    } catch (error) {
        console.error(`[Google Indexing] Failed to submit ${url}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Submit multiple URLs to Google's Indexing API.
 *
 * @param {string[]} urls - Array of full URLs to submit
 * @param {'URL_UPDATED' | 'URL_DELETED'} type - The notification type
 * @returns {Promise<{results: Array<{url: string, success: boolean, error?: string}>}>}
 */
export async function submitUrlsToGoogle(urls, type = 'URL_UPDATED') {
    const results = [];
    for (const url of urls) {
        const result = await submitUrlToGoogle(url, type);
        results.push({ url, ...result });
        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return { results };
}

/**
 * Build the full public URL for an area slug.
 */
export function buildAreaUrl(slug) {
    const baseUrl = process.env.SITE_URL || 'https://cartowingnearme.co.uk';
    return `${baseUrl}/area/${slug}`;
}
