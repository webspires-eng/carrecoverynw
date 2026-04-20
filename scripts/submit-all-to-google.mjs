// Bulk-submits all active area URLs + core pages to Google's Indexing API.
// Google's quota is 200 URL notifications/day per project. This script
// tracks progress in scripts/google-indexing-progress.json so it resumes
// across runs. Re-run daily until complete.
//
// Requires env: MONGODB_URI, SITE_URL (optional),
// and either GOOGLE_INDEXING_KEY_JSON or GOOGLE_INDEXING_KEY_PATH.
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { MongoClient } from 'mongodb';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { sign } from 'crypto';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI not set');

const SITE_URL = (process.env.SITE_URL || 'https://www.cartowingnearme.co.uk').replace(/\/$/, '');
const DAILY_LIMIT = 190;                       // stay under the 200/day quota
const DELAY_MS = 500;                          // gap between requests
const PROGRESS_FILE = 'scripts/google-indexing-progress.json';

const INDEXING_API_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/indexing';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadServiceAccountKey() {
    const keyJson = process.env.GOOGLE_INDEXING_KEY_JSON;
    if (keyJson) return JSON.parse(keyJson);
    const keyPath = process.env.GOOGLE_INDEXING_KEY_PATH;
    if (!keyPath) throw new Error('Set GOOGLE_INDEXING_KEY_JSON or GOOGLE_INDEXING_KEY_PATH');
    return JSON.parse(readFileSync(keyPath, 'utf-8'));
}

function createSignedJWT(sa) {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = { iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 };
    const encode = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const unsigned = `${encode(header)}.${encode(payload)}`;
    const signature = sign('RSA-SHA256', Buffer.from(unsigned), sa.private_key);
    return `${unsigned}.${signature.toString('base64url')}`;
}

let cachedToken = null;
let tokenExpiry = 0;
async function getAccessToken() {
    if (cachedToken && Date.now() < tokenExpiry - 300_000) return cachedToken;
    const jwt = createSignedJWT(loadServiceAccountKey());
    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });
    if (!res.ok) throw new Error(`Token ${res.status}: ${await res.text()}`);
    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + data.expires_in * 1000;
    return cachedToken;
}

async function notifyUrl(url) {
    const token = await getAccessToken();
    const res = await fetch(INDEXING_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url, type: 'URL_UPDATED' }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = body?.error?.message || `HTTP ${res.status}`;
        return { ok: false, error: msg, status: res.status };
    }
    return { ok: true };
}

function loadProgress() {
    if (!existsSync(PROGRESS_FILE)) return { submitted: {}, failed: {} };
    try { return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8')); }
    catch { return { submitted: {}, failed: {} }; }
}
function saveProgress(p) {
    writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}

function isQuotaError(msg = '') {
    const m = msg.toLowerCase();
    return m.includes('quota') || m.includes('rate limit') || m.includes('exhaust');
}

async function main() {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('carrecoverynw');
    const areas = await db.collection('areas')
        .find({ is_active: true })
        .project({ slug: 1 })
        .toArray();

    // Build target list: core pages first (high-value), then all areas.
    const coreUrls = [
        `${SITE_URL}/`,
        `${SITE_URL}/areas`,
        `${SITE_URL}/about-us`,
        `${SITE_URL}/contact-us`,
        `${SITE_URL}/booking`,
    ];
    const areaUrls = areas.map((a) => `${SITE_URL}/areas/${a.slug}`);
    const allUrls = [...coreUrls, ...areaUrls];

    const progress = loadProgress();
    const pending = allUrls.filter((u) => !progress.submitted[u]);

    console.log(`Total URLs: ${allUrls.length}`);
    console.log(`Already submitted: ${Object.keys(progress.submitted).length}`);
    console.log(`Pending: ${pending.length}`);
    console.log(`Daily limit: ${DAILY_LIMIT}`);

    if (pending.length === 0) {
        console.log('Nothing to do — all URLs already submitted.');
        await client.close();
        return;
    }

    const todayBatch = pending.slice(0, DAILY_LIMIT);
    console.log(`Submitting ${todayBatch.length} URLs this run...\n`);

    let ok = 0, fail = 0, quotaHit = false;
    for (let i = 0; i < todayBatch.length; i++) {
        const url = todayBatch[i];
        const result = await notifyUrl(url);
        if (result.ok) {
            progress.submitted[url] = new Date().toISOString();
            delete progress.failed[url];
            ok++;
            console.log(`[${i + 1}/${todayBatch.length}] OK   ${url}`);
        } else {
            progress.failed[url] = { error: result.error, at: new Date().toISOString() };
            fail++;
            console.log(`[${i + 1}/${todayBatch.length}] FAIL ${url} — ${result.error}`);
            if (isQuotaError(result.error) || result.status === 429) {
                console.log('\nQuota exhausted — stopping. Re-run tomorrow to continue.');
                quotaHit = true;
                saveProgress(progress);
                break;
            }
        }
        // Save every 10 to survive interruptions.
        if ((i + 1) % 10 === 0) saveProgress(progress);
        await sleep(DELAY_MS);
    }

    saveProgress(progress);
    const remaining = allUrls.length - Object.keys(progress.submitted).length;
    console.log(`\nDone. OK: ${ok}, Failed: ${fail}. Remaining across all runs: ${remaining}`);
    if (remaining > 0 && !quotaHit) {
        console.log('Re-run tomorrow to submit the next batch (quota resets daily).');
    }
    await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
