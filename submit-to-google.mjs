#!/usr/bin/env node

/**
 * CLI utility to manually submit URLs to Google's Indexing API.
 *
 * Usage:
 *   node submit-to-google.mjs <url> [URL_UPDATED|URL_DELETED]
 *   node submit-to-google.mjs --all-areas
 *
 * Environment:
 *   GOOGLE_INDEXING_KEY_PATH - Path to the service account JSON key file
 *   SITE_URL                 - Base URL of the site (default: https://cartowingnearme.co.uk)
 *   MONGODB_URI              - MongoDB connection string (required for --all-areas)
 *
 * Examples:
 *   GOOGLE_INDEXING_KEY_PATH=./service-account.json node submit-to-google.mjs https://cartowingnearme.co.uk/areas/birmingham
 *   GOOGLE_INDEXING_KEY_PATH=./service-account.json node submit-to-google.mjs --all-areas
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { sign } from 'crypto';

const INDEXING_API_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/indexing';
const SITE_URL = process.env.SITE_URL || 'https://cartowingnearme.co.uk';

function loadKey() {
    const keyPath = process.env.GOOGLE_INDEXING_KEY_PATH;
    if (!keyPath) {
        console.error('❌ GOOGLE_INDEXING_KEY_PATH environment variable not set');
        process.exit(1);
    }
    return JSON.parse(readFileSync(keyPath, 'utf-8'));
}

function createJWT(sa) {
    const now = Math.floor(Date.now() / 1000);
    const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const header = encode({ alg: 'RS256', typ: 'JWT' });
    const payload = encode({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 });
    const unsigned = `${header}.${payload}`;
    const sig = sign('RSA-SHA256', Buffer.from(unsigned), sa.private_key).toString('base64url');
    return `${unsigned}.${sig}`;
}

async function getToken(sa) {
    const jwt = createJWT(sa);
    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });
    if (!res.ok) throw new Error(`Token error: ${res.status} ${await res.text()}`);
    return (await res.json()).access_token;
}

async function submitUrl(token, url, type) {
    const res = await fetch(INDEXING_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url, type }),
    });
    const data = await res.json();
    if (res.ok) {
        console.log(`✅ ${type}: ${url}`);
    } else {
        console.error(`❌ ${url}: ${data.error?.message || res.status}`);
    }
    return data;
}

async function getAllAreaUrls() {
    // If MONGODB_URI is available, connect directly
    if (process.env.MONGODB_URI) {
        const { MongoClient } = await import('mongodb');
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const db = client.db();
        const areas = await db.collection('areas').find({ is_active: true }, { projection: { slug: 1 } }).toArray();
        await client.close();
        return areas.map(a => `${SITE_URL}/areas/${a.slug}`);
    }

    // Otherwise, try fetching via the API
    console.log('⚠️ MONGODB_URI not found. Fetching from API instead...');
    const apiUrl = process.env.API_URL || `${SITE_URL}/api/areas?limit=1000`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`API fetch failed: ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.data) throw new Error('Invalid API response format');
    return data.data.filter(a => a.is_active !== false).map(a => `${SITE_URL}/areas/${a.slug}`);
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage:');
        console.log('  node submit-to-google.mjs <url> [URL_UPDATED|URL_DELETED]');
        console.log('  node submit-to-google.mjs --all-areas');
        process.exit(0);
    }

    const sa = loadKey();
    const token = await getToken(sa);

    if (args[0] === '--all-areas') {
        console.log('📡 Fetching all active area URLs from database...');
        const urls = await getAllAreaUrls();
        console.log(`Found ${urls.length} active areas. Submitting...`);

        let success = 0, fail = 0;
        for (const url of urls) {
            try {
                await submitUrl(token, url, 'URL_UPDATED');
                success++;
            } catch {
                fail++;
            }
            // Rate limit: small delay between requests
            await new Promise(r => setTimeout(r, 100));
        }
        console.log(`\n📊 Done: ${success} succeeded, ${fail} failed out of ${urls.length}`);
    } else {
        const url = args[0];
        const type = args[1] || 'URL_UPDATED';
        await submitUrl(token, url, type);
    }
}

main().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
