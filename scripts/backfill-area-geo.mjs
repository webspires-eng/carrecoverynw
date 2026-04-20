// Backfills county + latitude + longitude + region for all areas via Nominatim (OpenStreetMap).
// Policy: 1 req/sec max, User-Agent required. https://operations.osmfoundation.org/policies/nominatim/
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { MongoClient } from 'mongodb';
import fs from 'fs';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI not set');

const UA = 'CarRecoveryUK-GeoBackfill/1.0 (info@carrecoveryuk.co.uk)';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function geocode(name) {
    const params = new URLSearchParams({
        q: name + ', United Kingdom',
        format: 'json',
        addressdetails: '1',
        limit: '1',
        countrycodes: 'gb',
    });
    const url = `https://nominatim.openstreetmap.org/search?${params}`;
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-GB' } });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const data = await res.json();
    if (!data.length) return null;
    const r = data[0];
    const a = r.address || {};
    // county can live under several keys depending on place type
    const county = a.county || a.state_district || a.region || a.city || a.state || null;
    const postcode = (a.postcode || '').split(' ')[0] || null;
    return {
        latitude: parseFloat(r.lat),
        longitude: parseFloat(r.lon),
        county,
        postcode_prefix: postcode,
    };
}

async function main() {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('carrecoverynw');
    const col = db.collection('areas');

    const filter = {
        is_active: true,
        $or: [
            { latitude: null }, { latitude: { $exists: false } },
            { longitude: null }, { longitude: { $exists: false } },
            { county: null }, { county: '' }, { county: { $exists: false } },
        ],
    };
    const areas = await col.find(filter).project({ slug: 1, name: 1, county: 1, latitude: 1, longitude: 1, postcode_prefix: 1 }).toArray();
    console.log(`To process: ${areas.length}`);

    const failures = [];
    let ok = 0;
    for (let i = 0; i < areas.length; i++) {
        const a = areas[i];
        try {
            const g = await geocode(a.name);
            if (!g) {
                failures.push({ slug: a.slug, name: a.name, reason: 'no_result' });
                console.log(`[${i + 1}/${areas.length}] MISS ${a.name}`);
            } else {
                const update = { updated_at: new Date() };
                if (g.latitude) update.latitude = g.latitude;
                if (g.longitude) update.longitude = g.longitude;
                if (g.county && !a.county) update.county = g.county;
                if (g.county) update.region = g.county;
                if (g.postcode_prefix && !a.postcode_prefix) update.postcode_prefix = g.postcode_prefix;
                await col.updateOne({ _id: a._id }, { $set: update });
                ok++;
                console.log(`[${i + 1}/${areas.length}] OK   ${a.name} -> ${g.county || '?'} (${g.latitude?.toFixed(3)}, ${g.longitude?.toFixed(3)})`);
            }
        } catch (e) {
            failures.push({ slug: a.slug, name: a.name, reason: e.message });
            console.log(`[${i + 1}/${areas.length}] ERR  ${a.name}: ${e.message}`);
        }
        // Nominatim: 1 req/sec. Add margin.
        await sleep(1100);
    }

    fs.writeFileSync('scripts/backfill-failures.json', JSON.stringify(failures, null, 2));
    console.log(`Done. Updated: ${ok}/${areas.length}. Failures: ${failures.length}. See scripts/backfill-failures.json`);
    await client.close();
}

main().catch(e => { console.error(e); process.exit(1); });
