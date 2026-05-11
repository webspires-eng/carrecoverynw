// Audit thin area pages and rewrite their custom_services / custom_faqs / bottom_content
// in three steps:
//   1. Audit: flag pages that fall below the minimum thresholds.
//   2. Template: build a deterministic Semantic-EAV draft from the area's own DB fields.
//   3. LLM rewrite: pass each draft block through Claude Sonnet so the prose is unique,
//      while keeping all entities, road names, area names, services, EAV facts, LSI terms,
//      and commercial intent phrases intact.
//
// Usage:
//   node scripts/audit-and-rewrite-areas.mjs                    # audit only (CSV)
//   node scripts/audit-and-rewrite-areas.mjs --rewrite          # audit + Claude rewrite + update DB
//   node scripts/audit-and-rewrite-areas.mjs --rewrite --limit 5
//   node scripts/audit-and-rewrite-areas.mjs --rewrite --no-llm # template only, skip Claude
//
// Requires: MONGODB_URI and ANTHROPIC_API_KEY in .env.local (skip ANTHROPIC_API_KEY with --no-llm).

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { MongoClient } from 'mongodb';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('Missing MONGODB_URI in .env.local');
    process.exit(1);
}

const args = process.argv.slice(2);
const REWRITE = args.includes('--rewrite');
const USE_LLM = !args.includes('--no-llm');
const limitArg = args.indexOf('--limit');
const REWRITE_LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : Infinity;

const THRESHOLDS = {
    serviceMinWords: 150,
    bottomMinWords: 400,
    minFaqs: 5,
};

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const CALL_DELAY_MS = 500;

const REWRITE_SYSTEM_PROMPT =
    "You are rewriting car recovery service page content for a specific UK location. " +
    "You will receive a structured draft. Rewrite it so the sentence structure, paragraph order, " +
    "and phrasing are unique — do not follow the same skeleton as the draft. Keep all entities, " +
    "road names, area names, service types, EAV facts, LSI terms, and commercial intent phrases intact. " +
    "Do not add fluff. Grade 7 reading level. Conversational tone. Never use: seamless, tailored, " +
    "navigate, crucial, leverage, look no further, in today's fast-paced world.";

let anthropic = null;
if (REWRITE && USE_LLM) {
    if (!process.env.ANTHROPIC_API_KEY) {
        console.error('Missing ANTHROPIC_API_KEY in .env.local (or pass --no-llm to skip the LLM step).');
        process.exit(1);
    }
    anthropic = new Anthropic();
}

// ───────────────────────────────────────────────────────────────────────────
// Utility
// ───────────────────────────────────────────────────────────────────────────
const wordCount = (s = '') => String(s).replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function parseJsonOrArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try { return JSON.parse(value); } catch { return []; }
    }
    return [];
}

function csvEscape(v) {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ───────────────────────────────────────────────────────────────────────────
// Part A — Audit
// ───────────────────────────────────────────────────────────────────────────
function auditArea(area) {
    const services = parseJsonOrArray(area.custom_services);
    const faqs = parseJsonOrArray(area.custom_faqs);
    const majorRoads = parseJsonOrArray(area.major_roads);

    const services_thin = services.length === 0
        ? true
        : services.some(s => wordCount(s.description || '') < THRESHOLDS.serviceMinWords);

    const bottom_content_thin = wordCount(area.bottom_content || '') < THRESHOLDS.bottomMinWords;
    const faqs_missing = faqs.length < THRESHOLDS.minFaqs;
    const major_roads_missing = majorRoads.length === 0;

    return { services_thin, bottom_content_thin, faqs_missing, major_roads_missing };
}

// ───────────────────────────────────────────────────────────────────────────
// Part B — Template generators (Semantic EAV / NLP framework)
// ───────────────────────────────────────────────────────────────────────────
function pickRoadLabel(majorRoads = []) {
    if (!majorRoads.length) return 'the surrounding A-roads and motorways';
    return majorRoads.slice(0, 3).join(', ');
}

function pickPrimaryRoad(majorRoads = []) {
    return majorRoads[0] || 'the local A-road network';
}

function pickNearbyTowns(nearbyAreas = []) {
    if (!nearbyAreas.length) return 'the surrounding towns';
    return nearbyAreas.slice(0, 4).join(', ');
}

function buildServices({ area, county, majorRoads, nearbyAreas }) {
    const roadList = pickRoadLabel(majorRoads);
    const primaryRoad = pickPrimaryRoad(majorRoads);
    const countyLabel = county ? `${county}` : 'your county';

    return [
        {
            title: `Emergency Breakdown Recovery in ${area}`,
            description:
                `Our emergency breakdown recovery in ${area} operates 24 hours a day, 7 days a week, with an average response time of 30 to 60 minutes. ` +
                `When you call us, a trained recovery operator is dispatched in a fully insured tow truck to your exact location across ${area} and the surrounding parts of ${countyLabel}. ` +
                `We cover everything from cars and vans to motorcycles, electric vehicles, hybrids, SUVs, 4x4s, and low clearance vehicles. ` +
                `Common breakdown call-outs in ${area} include flat batteries, engine failure, clutch failure, overheating, and seized brakes. ` +
                `If you are stranded on ${primaryRoad} or any of ${roadList}, our recovery vehicle is the closest unit dispatched — not a national hotline that subcontracts the job. ` +
                `Every recovery operator is fully insured, trained, and DBS-checked, and we hold a 5.0 rating on Google from 1207 verified reviews. ` +
                `Send your location pin via WhatsApp and we dispatch immediately — no work starts until you approve the price. ` +
                `Call now for emergency tow truck available now in ${area}, ${countyLabel}.`,
        },
        {
            title: `24/7 Roadside Assistance in ${area}`,
            description:
                `Our 24 hour roadside assistance in ${area}, ${countyLabel}, covers minor faults that do not require a full tow. ` +
                `A recovery operator arrives in a fully equipped van with a jump start kit, fuel transfer pump, wheel skates, and battery diagnostic tools. ` +
                `Typical roadside help in ${area} includes flat battery jump starts, wrong fuel recovery, tyre changes, lock-outs, and quick clutch or starter motor diagnostics. ` +
                `Where the fault can be fixed at the side of the road, you avoid the cost of a full recovery and get back on the road within the same visit. ` +
                `Our operators know ${area} street by street, so we shortcut traffic on ${primaryRoad} and reach you faster than national breakdown cover providers. ` +
                `Transparent pricing applies: you get a firm quote on the phone before we dispatch, with no hidden fees and no recovery work starting until you approve. ` +
                `For best car recovery service near ${area}, ${countyLabel}, our local response is faster than waiting hours for a national operator.`,
        },
        {
            title: `Flatbed Recovery in ${area}`,
            description:
                `Our flatbed recovery in ${area} is the safest method for transporting non-runners, low clearance vehicles, electric vehicles, and accident-damaged cars. ` +
                `The flatbed tow truck uses hydraulic loading and soft-strap tie-down to lift your vehicle without the wheels turning. ` +
                `This protects the gearbox, transmission, brakes, and bodywork — critical for EV-safe recovery and for any car with locked wheels, seized brakes, or a damaged drivetrain. ` +
                `We collect from any address in ${area}, including driveways with restricted access, multi-storey car parks, and the hard shoulder on ${roadList}. ` +
                `Once loaded, your vehicle is delivered to your home, your preferred garage, an MOT centre, or directly to a dealership across ${countyLabel} or nationwide. ` +
                `Every flatbed driver is trained, fully insured, and follows damage-free loading protocols, and we provide a damage-free guarantee in writing. ` +
                `Call now or book online in 60 seconds for flatbed recovery ${area}.`,
        },
        {
            title: `Accident Recovery in ${area}`,
            description:
                `Our accident recovery in ${area} is dispatched immediately after a collision, often working alongside police, traffic officers, and emergency services. ` +
                `If your vehicle is blocking a live lane on ${primaryRoad} or any of ${roadList}, we operate motorway clearance procedures to make the scene safe and reopen the road quickly. ` +
                `Each recovery truck carries a safety beacon, traffic cones, loading ramp, tow strap, and wheel skates so we can recover almost any vehicle condition — including write-offs, side-impact damage, and rolled vehicles. ` +
                `We support insurance claims with photo evidence, scene clearance reports, and direct garage referral if your insurer has not nominated a repairer. ` +
                `Whether the recovery is police-instructed or self-arranged, our driver in ${area} liaises with you, the traffic officer, and your insurer to keep the process simple. ` +
                `Trained operators, transparent pricing, and a 5.0 rating on Google from 1207 verified reviews mean you are dealing with a professional local recovery operator. ` +
                `Send your location pin now for fastest accident recovery in ${area}, ${countyLabel}.`,
        },
        {
            title: `Jump Start & Battery Recovery in ${area}`,
            description:
                `Our jump start service in ${area} restarts vehicles with a flat battery, faulty alternator, or parasitic drain — usually on the spot within 20 to 40 minutes. ` +
                `A recovery operator arrives with a heavy-duty jump pack, multi-meter, and battery health tester to diagnose whether you need a jump, a charge, or a replacement battery. ` +
                `We jump start cars, vans, motorcycles, hybrids, and electric vehicle 12V auxiliary batteries safely, using EV-safe procedures where required. ` +
                `If the battery is dead and cannot be revived, we recover the vehicle to your nearest garage or your home address anywhere in ${area} and across ${countyLabel}. ` +
                `Common battery failures we see in ${area} happen on cold mornings, after short journeys, or following accidental interior lights left on overnight. ` +
                `Call now and a tow truck driver from ${area} will be with you, not a national call-centre handler an hour away. ` +
                `Get a free quote, send your location pin, and we dispatch immediately for cheapest breakdown recovery ${area}.`,
        },
        {
            title: `Motorway Recovery on ${primaryRoad}`,
            description:
                `Our motorway recovery on ${primaryRoad} and across ${roadList} is the highest priority dispatch we run. ` +
                `Breaking down on a live motorway carries serious safety risk, so our recovery vehicle aims to reach the hard shoulder within 30 minutes of your call. ` +
                `On arrival in ${area}, the operator deploys a safety beacon, uses our flatbed tow truck or wheel-lift recovery setup, and clears the lane in coordination with the traffic officer. ` +
                `We recover cars, vans, motorcycles, low clearance vehicles, and electric vehicles using hydraulic loading and soft-strap tie-down — keeping the recovery damage-free even at speed-restricted scenes. ` +
                `Our operators understand the local geography around ${area}, ${countyLabel}, including known breakdown hotspots and junction layouts on ${roadList}. ` +
                `Whether the call is self-arranged or police-instructed recovery, you get transparent pricing, a fully insured driver, and a 5.0 Google rating. ` +
                `Send your live location pin via WhatsApp now — emergency tow truck available now in ${area}.`,
        },
    ];
}

function buildFaqs({ area, county, majorRoads }) {
    const roadList = pickRoadLabel(majorRoads);
    const primaryRoad = pickPrimaryRoad(majorRoads);
    const countyLabel = county ? `${county}` : 'the surrounding county';

    return [
        {
            question: `How fast can a tow truck reach me in ${area}?`,
            answer:
                `A tow truck in ${area} typically reaches you within 30 to 60 minutes, with most call-outs in central ${area} answered in under 30 minutes. ` +
                `Response time depends on traffic on ${primaryRoad}, weather, and time of day. ` +
                `As a local recovery operator covering ${area} and ${countyLabel}, we run our own recovery vehicles rather than subcontracting jobs to national providers, which is why we respond faster than nationwide breakdown cover companies. ` +
                `Send your location pin via WhatsApp the moment you call — we dispatch immediately.`,
        },
        {
            question: `How much does car recovery cost in ${area}?`,
            answer:
                `Car recovery in ${area} usually costs between £60 and £180 depending on distance, vehicle type, and time of day. ` +
                `You get a firm quote on the phone before any tow truck is dispatched — no work starts until you approve the price. ` +
                `We charge transparent pricing with no hidden fees, accept card, cash, and bank transfer, and issue a full receipt for insurance claims or expense reimbursement. ` +
                `For longer transports across ${countyLabel} or nationwide, we offer pre-booked fixed-price flatbed recovery.`,
        },
        {
            question: `What should I do if my car breaks down on ${primaryRoad}?`,
            answer:
                `If you break down on ${primaryRoad}, get behind the barrier on the verge, switch on hazard lights, and call us immediately for emergency tow truck available now in ${area}. ` +
                `On a smart motorway with no hard shoulder, follow Highways England advice: move into an emergency refuge area if possible, leave the vehicle, and stand behind the barrier. ` +
                `We coordinate with the traffic officer and police on motorway clearance and dispatch a flatbed recovery vehicle straight to your location. ` +
                `Stay on the line — our operator stays with you until the truck arrives.`,
        },
        {
            question: `Do you recover electric vehicles in ${area}?`,
            answer:
                `Yes — we provide EV-safe recovery for electric vehicles and hybrids in ${area} using flatbed tow trucks only, never wheel-lift recovery. ` +
                `Towing an electric vehicle on its drive wheels can damage the motor and regen braking system, so a flatbed with hydraulic loading and soft-strap tie-down is the only correct method. ` +
                `Our operators are trained on high-voltage isolation procedures and the manufacturer-specific tow points for Tesla, Nissan Leaf, BMW iX, Polestar, MG, and other EVs commonly on the road in ${countyLabel}.`,
        },
        {
            question: `Is 24-hour breakdown recovery available in ${area}?`,
            answer:
                `Yes — 24 hour roadside assistance in ${area} runs every day of the year, including Christmas Day, New Year's Day, and all UK bank holidays. ` +
                `Our recovery operators in ${area} work overnight shifts, so a real human answers the phone at 3am and a real tow truck driver — not a call-centre agent — is dispatched. ` +
                `This is genuine 24/7 emergency recovery, not an answerphone service.`,
        },
        {
            question: `Why choose a local recovery operator in ${area} over a national breakdown company?`,
            answer:
                `A local recovery operator in ${area} reaches you faster than national breakdown cover providers because we dispatch our own driver instead of subcontracting the job. ` +
                `National providers route your call to a central dispatch, then re-quote it to whichever third-party operator covers ${countyLabel} — adding 30 to 90 minutes to your wait. ` +
                `We know the side streets, the traffic patterns on ${roadList}, and the known breakdown hotspots in and around ${area}. ` +
                `Local knowledge, transparent pricing, and a 5.0 Google rating from 1207 verified reviews are why drivers in ${area} call us first.`,
        },
        {
            question: `Can you recover a car with locked wheels or seized brakes in ${area}?`,
            answer:
                `Yes — we recover cars with locked wheels, seized brakes, or a damaged drivetrain in ${area} using wheel skates and flatbed loading. ` +
                `Wheel skates slide under the locked wheels so we can roll the vehicle onto the flatbed tow truck without dragging it. ` +
                `This is the safest method for non-runners, crash-damaged cars, and vehicles with handbrake faults, and it keeps the recovery 100% damage-free.`,
        },
    ];
}

function buildBottomContent({ area, county, majorRoads, nearbyAreas }) {
    const roadList = pickRoadLabel(majorRoads);
    const primaryRoad = pickPrimaryRoad(majorRoads);
    const towns = pickNearbyTowns(nearbyAreas);
    const countyLabel = county ? `${county}` : 'the surrounding county';

    return `
<h2>24/7 Car Recovery in ${area} — Local, Insured, Damage-Free</h2>
<p>Car Recovery UK is a fully insured local recovery operator covering ${area} and the surrounding parts of ${countyLabel}. Our recovery vehicle network operates 24 hours a day with an average response time of 30 to 60 minutes for emergency tow truck available now in ${area}. Whether you have broken down on ${primaryRoad}, parked up with a flat battery in central ${area}, or had an accident on one of ${roadList}, a trained recovery operator is dispatched directly to your location pin. No call-centre handovers, no waiting two hours for a national subcontractor — just a local tow truck driver from ${area} on the way to you.</p>

<h3>The Services We Run From ${area}</h3>
<p>Our coverage from ${area} includes emergency breakdown recovery, accident recovery, flatbed recovery, jump start service, wrong fuel recovery, motorway clearance on ${roadList}, non-runner collection, winch recovery for ditched vehicles, and pre-booked vehicle transport across ${countyLabel} or nationwide. We recover cars, vans, motorcycles, electric vehicles, hybrids, SUVs, 4x4s, and low clearance vehicles using the correct method for each — flatbed tow with hydraulic loading and soft-strap tie-down for EVs and damaged cars, wheel-lift recovery for short transfers, and wheel skates for vehicles with seized brakes or locked wheels.</p>

<h3>Why Drivers in ${area} Choose Us Over National Breakdown Cover</h3>
<p>National recovery companies route your call to a central dispatch desk, then re-quote the job out to whichever local operator covers ${area} that day. That handover usually costs you 30 to 90 minutes. As an independent recovery operator based near ${area}, we own the recovery trucks, employ the drivers, and answer the phone ourselves. The result is a faster response than national breakdown cover, transparent pricing with no hidden fees, and a recovery operator who knows the side streets, the rush-hour traffic on ${primaryRoad}, the known breakdown hotspots, and the local garages in ${countyLabel}. We hold a 5.0 rating on Google from 1207 verified reviews, every operator is fully insured and trained, and every recovery comes with a damage-free guarantee in writing.</p>

<h3>Where We Cover Around ${area}</h3>
<p>We service ${area} town and the nearby towns of ${towns}, plus every postcode in between. Our recovery vehicles routinely cover ${roadList} and the surrounding A-roads, with priority dispatch for any breakdown on a live motorway lane or hard shoulder. If you have moved to ${area} from elsewhere and your existing breakdown cover is slow to respond, you can call us directly for a one-off recovery without joining a membership.</p>

<h3>What Happens When You Call</h3>
<p>When you call us, the recovery operator confirms your exact location — ideally a WhatsApp location pin from your phone — and gives you a firm fixed price on the spot. No work starts until you approve the price. The closest tow truck driver to ${area} is dispatched immediately, and you receive live updates by SMS or WhatsApp until the truck arrives. On arrival, the operator checks the vehicle, loads it using the correct damage-free method, and transports it to your home, your nominated garage, an MOT centre, a dealership, or a secure storage facility — whichever you choose. Card, cash, and bank transfer are all accepted, and you receive a full receipt suitable for insurance claims or expense reimbursement.</p>

<h3>Ready to Get Moving Again?</h3>
<p>Call now for 24 hour roadside assistance in ${area}, ${countyLabel}. Get a free quote, send your location pin, and we dispatch immediately. Book online in 60 seconds if you prefer — your local recovery operator is one tap away.</p>
`.trim();
}

// ───────────────────────────────────────────────────────────────────────────
// Step 3 — Claude rewrite pass
// ───────────────────────────────────────────────────────────────────────────
async function llmRewriteJson({ instruction, draftObject, area }) {
    if (!anthropic) return draftObject;

    const userPrompt =
        `Area: ${area.name}${area.county ? `, ${area.county}` : ''}\n\n` +
        `${instruction}\n\n` +
        `Return only valid JSON matching the shape of the draft below. ` +
        `Do not wrap in code fences. Do not add commentary.\n\n` +
        `Draft:\n${JSON.stringify(draftObject, null, 2)}`;

    const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 16000,
        system: REWRITE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('')
        .trim();

    // Strip optional code fences if the model added them
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

    try {
        return JSON.parse(cleaned);
    } catch (err) {
        console.warn(`  [LLM] JSON parse failed — keeping templated draft. Error: ${err.message}`);
        return draftObject;
    }
}

async function llmRewriteHtml({ instruction, draftHtml, area }) {
    if (!anthropic) return draftHtml;

    const userPrompt =
        `Area: ${area.name}${area.county ? `, ${area.county}` : ''}\n\n` +
        `${instruction}\n\n` +
        `Return only the rewritten HTML body. Keep the same H2/H3 structure. ` +
        `Do not wrap in code fences. Do not add commentary or a preamble.\n\n` +
        `Draft HTML:\n${draftHtml}`;

    const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 16000,
        system: REWRITE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('')
        .trim();

    return text.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/, '').trim();
}

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────
async function main() {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    await client.connect();
    const db = client.db('carrecoverynw');
    const coll = db.collection('areas');

    const areas = await coll.find({ is_active: true }).toArray();
    console.log(`Loaded ${areas.length} active areas.`);

    // Step 1 — Audit + CSV
    const rows = [];
    let flaggedCount = 0;
    for (const area of areas) {
        const a = auditArea(area);
        const flagged = a.services_thin || a.bottom_content_thin || a.faqs_missing || a.major_roads_missing;
        if (flagged) flaggedCount++;
        rows.push({
            slug: area.slug || '',
            area_name: area.name || '',
            county: area.county || '',
            services_thin: a.services_thin,
            bottom_content_thin: a.bottom_content_thin,
            faqs_missing: a.faqs_missing,
            major_roads_missing: a.major_roads_missing,
        });
    }

    const csvHeader = 'slug,area_name,county,services_thin,bottom_content_thin,faqs_missing,major_roads_missing\n';
    const csvBody = rows.map(r =>
        [r.slug, r.area_name, r.county, r.services_thin, r.bottom_content_thin, r.faqs_missing, r.major_roads_missing]
            .map(csvEscape).join(',')
    ).join('\n');
    const outDir = path.join(process.cwd(), 'scripts', 'output');
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, 'area-audit.csv');
    fs.writeFileSync(outFile, csvHeader + csvBody + '\n', 'utf8');
    console.log(`Audit CSV written: ${outFile}`);
    console.log(`Flagged ${flaggedCount} / ${areas.length} areas as thin.`);

    if (!REWRITE) {
        console.log('\nDry run complete. Re-run with --rewrite to update flagged areas.');
        await client.close();
        return;
    }

    // Steps 2 + 3 — Build templated draft, send through Claude, persist to DB
    let updated = 0;
    for (const area of areas) {
        if (updated >= REWRITE_LIMIT) break;
        const a = auditArea(area);
        if (!(a.services_thin || a.bottom_content_thin || a.faqs_missing)) continue;

        const majorRoads = parseJsonOrArray(area.major_roads);
        const nearbyAreas = parseJsonOrArray(area.nearby_areas);
        const ctx = { area: area.name, county: area.county || '', majorRoads, nearbyAreas };

        try {
            const update = {};

            if (a.services_thin) {
                const draftServices = buildServices(ctx);
                if (CALL_DELAY_MS && anthropic) await sleep(CALL_DELAY_MS);
                const rewritten = await llmRewriteJson({
                    instruction:
                        `Rewrite the following array of car recovery service blocks for ${area.name}. ` +
                        `Each block has a "title" and a "description". Keep titles intact unless trivially reworded. ` +
                        `Rewrite each "description" so the sentence structure, paragraph order, and phrasing differ from the draft, ` +
                        `but preserve every road name, area name, service type, EAV fact (response times, 24/7, damage-free, ` +
                        `transparent pricing, 5.0 / 1207 reviews), vehicle type, condition entity, and commercial intent phrase. ` +
                        `Each rewritten description must remain at least 150 words.`,
                    draftObject: draftServices,
                    area,
                });
                update.custom_services = JSON.stringify(rewritten);
            }

            if (a.faqs_missing) {
                const draftFaqs = buildFaqs(ctx);
                if (CALL_DELAY_MS && anthropic) await sleep(CALL_DELAY_MS);
                const rewritten = await llmRewriteJson({
                    instruction:
                        `Rewrite the following FAQ array for ${area.name}. Each entry has "question" and "answer". ` +
                        `Keep the questions almost identical (they are search queries). Rewrite each "answer" so the ` +
                        `first sentence still gives a direct, plain-language answer in under 40 words (Position-Zero style), ` +
                        `followed by a supporting paragraph. Preserve every road name, area name, vehicle type, ` +
                        `service detail, EAV fact, and commercial intent phrase.`,
                    draftObject: draftFaqs,
                    area,
                });
                update.custom_faqs = JSON.stringify(rewritten);
            }

            if (a.bottom_content_thin) {
                const draftHtml = buildBottomContent(ctx);
                if (CALL_DELAY_MS && anthropic) await sleep(CALL_DELAY_MS);
                const rewritten = await llmRewriteHtml({
                    instruction:
                        `Rewrite the long-form HTML body for the ${area.name} car recovery page. ` +
                        `Keep the same H2/H3 section structure (the headings can be reworded). ` +
                        `Rewrite the paragraphs underneath each heading so the sentence structure and phrasing are ` +
                        `unique versus the draft. Preserve every road name, nearby town, area name, county, service ` +
                        `entity, EAV fact, and commercial intent phrase. Keep the total length at 400 words or more.`,
                    draftHtml,
                    area,
                });
                update.bottom_content = rewritten;
            }

            update.updated_at = new Date();
            await coll.updateOne({ _id: area._id }, { $set: update });
            updated++;
            const fields = Object.keys(update).filter(k => k !== 'updated_at').join(', ');
            console.log(`Updated [${updated}] /areas/${area.slug} — ${fields}`);
        } catch (err) {
            console.error(`Failed to update /areas/${area.slug}: ${err.message}`);
        }
    }
    console.log(`\nRewrite complete. ${updated} areas updated.`);
    if (rows.some(r => r.major_roads_missing)) {
        console.log('Note: some areas are still missing major_roads. Run the geocode/backfill script to populate those before rerunning rewrites for fully road-aware copy.');
    }

    await client.close();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
