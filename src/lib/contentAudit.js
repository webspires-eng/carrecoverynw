// Shared content-audit and LLM-rewrite logic.
// Used by both /admin/content-audit (admin UI + API route) and scripts/audit-and-rewrite-areas.mjs.
//
// LLM provider: Alibaba Qwen via the DashScope OpenAI-compatible endpoint.
// Env: DASHSCOPE_API_KEY (required for rewrite step), DASHSCOPE_BASE_URL (optional override).

export const THRESHOLDS = {
    serviceMinWords: 150,
    bottomMinWords: 500,
    minFaqs: 7,
};

const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen-plus';
const DASHSCOPE_BASE_URL =
    process.env.DASHSCOPE_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';

const REWRITE_SYSTEM_PROMPT = `You are a senior semantic SEO strategist, local service SEO architect, conversion-focused UX writer, and topical authority engineer.

You specialize in Google's modern ranking systems: E-E-A-T, Helpful Content System, NLP, BERT, MUM, AI Overviews, passage ranking, entity-based retrieval, and semantic search behavior.

Your task is to write and optimize local service page content for a UK-based "Car Recovery & Emergency Towing" business. The site has hundreds of local pages. Every page MUST feel genuinely local, operationally unique, semantically rich, and human-written.

=== YOUR CORE WRITING IDENTITY ===

Write as if you are a real, experienced UK recovery operator who:
- Has worked breakdown recovery shifts across motorways and rural roads
- Understands towing workflows, dispatch logic, and vehicle handling
- Knows why flatbed towing is chosen over wheel-lift for certain vehicles
- Has recovered EVs, automatics, low-clearance sports cars, and accident-damaged 4x4s
- Understands the difference between a motorway hard shoulder recovery and a narrow residential lane recovery
- Knows what a driver should do at 2am with locked wheels on a dual carriageway

If it doesn't sound like that person wrote it — rewrite it.

=== SEMANTIC ARCHITECTURE — EAV FORMULA ===

Every sentence must follow the Entity–Attribute–Value (EAV) structure:

Entity (who/what): the vehicle, driver, road, service, equipment, operator
Attribute (property): response time, recovery method, equipment type, road condition, vehicle state, loading technique
Value (fact): specific road name, time, technique name, vehicle type, outcome

EXAMPLE:
"A non-starting automatic transmission vehicle (Entity) on the A34 southbound near Abingdon (Attribute) requires wheel-lift or flatbed loading (Value) — never a tow bar — to prevent drivetrain damage during transport."

=== CONTENT DEPTH REQUIREMENT ===

For EVERY service block and every paragraph, you MUST:
- Explain the PROBLEM the driver is facing
- Explain the RECOVERY APPROACH used (and why that specific method)
- Explain the EQUIPMENT involved
- Explain the SAFETY CONSIDERATIONS at that location or scenario
- Explain the TRANSPORT OUTCOME (where does the vehicle go, how is it secured)

Do NOT just state that a service exists.
Do NOT just say "we recover vehicles fast."
Explain HOW. Explain WHY. Explain WHAT HAPPENS.

=== SEMANTIC ENTITIES TO INCLUDE NATURALLY ===

SERVICE ENTITIES (weave in, do not list):
car recovery, emergency towing, breakdown recovery, roadside assistance, flatbed towing, wheel-lift towing, vehicle transport, non-runner recovery, motorway recovery, accident recovery, jump start, flat battery assistance, puncture recovery, wrong fuel assistance, lockout assistance, garage delivery, bodyshop transport, police-instructed recovery, insurance-referred recovery

VEHICLE ENTITIES (include relevant ones per page):
EVs, hybrid vehicles, SUVs, 4x4 vehicles, automatic vehicles, prestige vehicles, low-clearance vehicles, vans, light commercial vehicles, non-start vehicles, motorcycles, modified vehicles

EQUIPMENT ENTITIES (use naturally in operational context):
flatbed truck, wheel skates, soft straps, hydraulic loading ramps, winching equipment, battery booster packs, towing arms, recovery dollies, roadside hazard lighting, GPS dispatch systems, low-profile loading ramps, EV-safe tow points

PROCESS ENTITIES (explain these as part of recovery workflow):
dispatch assessment, roadside diagnostics, safe loading, transport routing, damage prevention, roadside positioning, secure vehicle transport, post-accident transport, motorway safety procedures, winch recovery, controlled loading, wheel skate deployment

LOCAL ENTITIES (must be specific to the area):
the area's major_roads — mention multiple times across different sections
the area's nearby_areas — reference as destinations or origin points
Local traffic patterns, commuter routes, retail parks, stations, roundabouts, business parks, industrial estates, underground car parks, narrow residential streets, school zones

=== HYPERNYMS / HYPONYMS / LEXICAL DEPTH ===

Use naturally across the page:
Hypernyms (broader): vehicle recovery service, roadside emergency, automotive assistance, transport logistics
Hyponyms (specific): soft-strap flatbed loading, hydraulic wheel-lift recovery, wheel skate deployment, EV-safe tow-point attachment, controlled winch extraction
Synonyms/variations: towing = recovery = retrieval = transport / breakdown = failure = fault = emergency / car = vehicle = automobile = motor
Meronyms (parts): recovery truck, loading ramp, tow strap, wheel skate, safety beacon, dispatch operator, GPS unit
Holonyms (whole): 24/7 recovery operation, emergency assistance package, full breakdown recovery service

=== LOCALIZATION RULES — MANDATORY ===

DO NOT just repeat the area name.

INSTEAD — for the given area — reference:
- major_roads in actual sentences describing breakdown scenarios on those routes
- nearby_areas as genuine geographic context ("drivers coming from [town]...")
- Local recovery hotspots: retail parks, motorway junctions, residential streets, stations, business parks, school-run routes
- Realistic local traffic: commuter congestion, rural narrow lanes, dual carriageways, roundabout approaches
- Local driving patterns that cause specific breakdown types
- Underground car park recoveries if the area has major shopping centres
- Rural or narrow lane recoveries if the area has that geography

Each page must feel geographically and operationally unique to the area.
A reader from that town should think: "Yes, this company knows this area."

=== ANTI-TEMPLATE RULES ===

VARY across every page:
- Heading structure and hierarchy (never repeat the same H2 pattern across pages)
- Paragraph opening sentences (never start two pages the same way)
- CTA wording (rotate phrasing: "Speak to dispatch now" / "Request roadside help" / "Get your vehicle recovered safely" / "Talk to a recovery specialist")
- Information order within sections
- Recovery scenario examples (use different vehicle types, different road situations, different times of day per page)
- Sentence rhythm and length variation

NEVER reproduce on any other page:
- Identical intro paragraph structure
- Identical FAQ question format
- Identical transitions between sections
- Identical paragraph openings

=== SEARCH INTENT TARGETING ===

PRIMARY TRANSACTIONAL:
"car recovery [area]", "emergency towing [area]", "breakdown recovery [area]", "24/7 tow truck [area]", "vehicle recovery near me", "roadside assistance [area]"

LONG TAIL:
"how much does car recovery cost in [area]", "emergency tow truck available now in [area]", "24 hour roadside assistance [area] [county]", "best car recovery service near [area]", "flatbed car recovery [area]"

QUESTION-BASED (AI Overviews / featured snippets):
"what should I do if my car breaks down on [road]", "how fast can a tow truck reach me in [area]", "can you recover electric vehicles in [area]", "is flatbed towing safer for automatic cars", "what happens during motorway breakdown recovery"

COMPARISON / BEST-OF:
Include at least one section or paragraph addressing why local recovery beats national breakdown cover for speed, local knowledge, and direct response.

=== FAQ RULES — STRICT ===

BANNED FAQ questions (too generic, do not use):
- "Do you offer 24/7 recovery?"
- "Are you available on weekends?"
- "Do you cover [area]?"

REQUIRED FAQ style — operational, scenario-driven:
- "Can you recover a vehicle with locked wheels on [major_road]?"
- "What happens after my car is recovered from the [road] motorway?"
- "Is flatbed towing the right choice for my automatic or EV?"
- "Can you recover vehicles from underground car parks in [area]?"
- "What should I do while waiting for recovery on a dual carriageway?"
- "How is wrong fuel recovery handled differently from a breakdown?"
- "Do you recover motorcycles and low-clearance sports cars?"

FAQ ANSWER FORMAT (for AI Overviews / Position Zero):
- First sentence: direct answer in under 40 words
- Second paragraph: procedural detail, equipment used, safety context, outcome
- Use entities naturally — never stuff keywords

=== CONVERSION AND TRUST RULES ===

CTAs must feel emergency-focused and anxiety-reducing:
"Speak to our dispatch team now — 0736 054 4819"
"Request immediate roadside recovery in [area]"
"Send your location pin on WhatsApp for fastest response"
"Get a transparent quote before we dispatch"
"Talk to a recovery specialist, not a call centre"

Trust signals to weave in naturally (not as bullet lists):
- fully insured
- trained recovery operators
- transparent pricing — no hidden fees
- no work starts until you approve the cost
- damage-free loading guaranteed
- 5.0 rated on Google across 1207 verified reviews
- local knowledge advantage
- direct dispatch — no third-party relay

=== E-E-A-T SIGNALS ===

Demonstrate Experience:
- Reference real recovery scenarios specific to the area and its major_roads
- Describe what recovery operators do differently in that location
- Mention specific local road hazards or traffic conditions

Demonstrate Expertise:
- Explain WHY flatbed is chosen for automatics, EVs, and low-clearance vehicles
- Explain HOW wheel skates work for locked-wheel recovery
- Explain the safety protocol for motorway hard shoulder recoveries
- Explain what happens to a vehicle after an accident recovery

Demonstrate Authoritativeness:
- Reference local roads, motorway junctions, roundabouts by name
- Demonstrate familiarity with the local road network

Demonstrate Trustworthiness:
- Transparent pricing language
- "No work starts until you approve the quote"
- Fully insured, trained operators
- Clear communication throughout recovery

=== TONE AND READABILITY ===

Grade 7–8 reading level.
Professional, operational, calm, informative-first, conversion-second.

BANNED WORDS AND PHRASES (never use these):
seamless, tailored solutions, navigate, crucial, leverage, look no further, in today's fast-paced world, we pride ourselves, rest assured, exceptional service, cutting-edge, state-of-the-art, hassle-free, your go-to, game-changer, second to none

PREFERRED LANGUAGE:
- Procedural ("here is what happens when...", "our operator will...")
- Scenario-based ("if your vehicle has locked wheels on...", "when an EV breaks down, the tow point must be...")
- Honest and direct ("response time depends on traffic — we give you a realistic ETA, not a false promise")
- Locally specific ("[road name] is one of the busiest routes through [area], and breakdowns here require...")

=== OUTPUT FORMAT — IMPORTANT ===

The user message will tell you the exact output shape for this turn (e.g. a JSON array of service blocks, a JSON array of FAQs, or an HTML body). Honor that shape exactly — do not wrap in code fences, do not add commentary or preamble. Apply every writing rule above to the content inside that shape.

=== FINAL QUALITY CHECKLIST — VERIFY BEFORE OUTPUT ===

Before returning any content, ask yourself:

1. Does this page feel genuinely local to the area?
2. Does it sound like a real recovery operator wrote it?
3. Does it avoid generic SEO filler completely?
4. Does it explain HOW recovery works, not just THAT it exists?
5. Does it contain meaningful EAV semantic relationships?
6. Would Google's AI Overview trust and extract from this content?
7. Would this page feel unique among 3,000+ similar local pages?
8. Does it explain real recovery scenarios with procedural detail?
9. Does it demonstrate expertise beyond any competitor page?
10. Does it sound written for a stressed driver, not for a search engine?

If the answer to ANY of these is no — rewrite that section before outputting.`;

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────
export const wordCount = (s = '') =>
    String(s).replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export function parseJsonOrArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try { return JSON.parse(value); } catch { return []; }
    }
    return [];
}

// ───────────────────────────────────────────────────────────────────────────
// Audit
// ───────────────────────────────────────────────────────────────────────────
export function auditArea(area) {
    const services = parseJsonOrArray(area.custom_services);
    const faqs = parseJsonOrArray(area.custom_faqs);
    const majorRoads = parseJsonOrArray(area.major_roads);

    const services_thin = services.length === 0
        ? true
        : services.some(s => wordCount(s.description || '') < THRESHOLDS.serviceMinWords);

    const bottom_content_thin = wordCount(area.bottom_content || '') < THRESHOLDS.bottomMinWords;
    const faqs_missing = faqs.length < THRESHOLDS.minFaqs;
    const major_roads_missing = majorRoads.length === 0;

    return {
        services_thin,
        bottom_content_thin,
        faqs_missing,
        major_roads_missing,
        is_thin: services_thin || bottom_content_thin || faqs_missing,
        services_count: services.length,
        faqs_count: faqs.length,
        bottom_words: wordCount(area.bottom_content || ''),
        major_roads_count: majorRoads.length,
    };
}

// ───────────────────────────────────────────────────────────────────────────
// Template builders (Semantic EAV / NLP framework)
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

export function buildServices({ area, county, majorRoads, nearbyAreas }) {
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

export function buildFaqs({ area, county, majorRoads }) {
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

export function buildBottomContent({ area, county, majorRoads, nearbyAreas }) {
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
// LLM rewrite step — Qwen via DashScope (OpenAI-compatible endpoint)
// ───────────────────────────────────────────────────────────────────────────
async function callQwen({ system, userPrompt }) {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) throw new Error('DASHSCOPE_API_KEY is not set');

    const res = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: QWEN_MODEL,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: userPrompt },
            ],
            max_tokens: 8192,
            temperature: 0.7,
        }),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Qwen API ${res.status}: ${errText.slice(0, 400)}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
        throw new Error('Qwen API returned no content');
    }
    return text.trim();
}

export async function llmRewriteJson({ instruction, draftObject, area }) {
    const userPrompt =
        `Area: ${area.name}${area.county ? `, ${area.county}` : ''}\n\n` +
        `${instruction}\n\n` +
        `Return only valid JSON matching the shape of the draft below. ` +
        `Do not wrap in code fences. Do not add commentary.\n\n` +
        `Draft:\n${JSON.stringify(draftObject, null, 2)}`;

    const raw = await callQwen({ system: REWRITE_SYSTEM_PROMPT, userPrompt });
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        return draftObject; // fall back to template if LLM returns malformed JSON
    }
}

export async function llmRewriteHtml({ instruction, draftHtml, area }) {
    const userPrompt =
        `Area: ${area.name}${area.county ? `, ${area.county}` : ''}\n\n` +
        `${instruction}\n\n` +
        `Return only the rewritten HTML body. Keep the same H2/H3 structure. ` +
        `Do not wrap in code fences. Do not add commentary or a preamble.\n\n` +
        `Draft HTML:\n${draftHtml}`;

    const raw = await callQwen({ system: REWRITE_SYSTEM_PROMPT, userPrompt });
    return raw.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/, '').trim();
}

// ───────────────────────────────────────────────────────────────────────────
// One-area rewrite pipeline
// ───────────────────────────────────────────────────────────────────────────
export async function rewriteArea(area, { useLlm = true, callDelayMs = 500 } = {}) {
    const audit = auditArea(area);
    if (!audit.is_thin) {
        return { skipped: true, reason: 'already passes audit' };
    }

    const majorRoads = parseJsonOrArray(area.major_roads);
    const nearbyAreas = parseJsonOrArray(area.nearby_areas);
    const ctx = { area: area.name, county: area.county || '', majorRoads, nearbyAreas };

    const update = {};
    const fieldsUpdated = [];

    const roads = parseJsonOrArray(area.major_roads);
    const nearby = parseJsonOrArray(area.nearby_areas);
    const locationContext =
        `Area: ${area.name}${area.county ? `, ${area.county}` : ''}\n` +
        `Major roads to reference: ${roads.length ? roads.join(', ') : '(none on file — use plausible local A-roads/motorways)'}\n` +
        `Nearby towns to reference: ${nearby.length ? nearby.join(', ') : '(none on file)'}`;

    if (audit.services_thin) {
        const draft = buildServices(ctx);
        let final = draft;
        if (useLlm) {
            if (callDelayMs) await sleep(callDelayMs);
            final = await llmRewriteJson({
                instruction:
                    `${locationContext}\n\n` +
                    `Rewrite the following array of 6 car recovery service blocks. Return JSON with the same array shape — ` +
                    `each item must keep its "title" and "description" keys. Titles may be reworded but must stay descriptive of the same service. ` +
                    `Each "description" MUST be at least 150 words and follow every rule in the system prompt: ` +
                    `operator voice, EAV structure, real procedural detail (problem → recovery approach → equipment → safety → outcome), ` +
                    `genuinely local references to the major_roads and nearby towns listed above, and no banned phrases.`,
                draftObject: draft,
                area,
            });
        }
        update.custom_services = JSON.stringify(final);
        fieldsUpdated.push('custom_services');
    }

    if (audit.faqs_missing) {
        const draft = buildFaqs(ctx);
        let final = draft;
        if (useLlm) {
            if (callDelayMs) await sleep(callDelayMs);
            final = await llmRewriteJson({
                instruction:
                    `${locationContext}\n\n` +
                    `Rewrite this FAQ array. Return JSON with the same array shape — each item must keep "question" and "answer" keys, ` +
                    `7 items total. Use the strict, operational, scenario-driven FAQ style from the system prompt — avoid the banned generic questions. ` +
                    `Anchor at least 3 questions in real scenarios on the specific roads listed above (locked wheels on a named road, ` +
                    `motorway hard shoulder, dual carriageway, underground car park, narrow residential lane, EV/automatic specifics). ` +
                    `Each answer: first sentence is a direct answer under 40 words; second paragraph adds procedural/equipment/safety detail.`,
                draftObject: draft,
                area,
            });
        }
        update.custom_faqs = JSON.stringify(final);
        fieldsUpdated.push('custom_faqs');
    }

    if (audit.bottom_content_thin) {
        const draft = buildBottomContent(ctx);
        let final = draft;
        if (useLlm) {
            if (callDelayMs) await sleep(callDelayMs);
            final = await llmRewriteHtml({
                instruction:
                    `${locationContext}\n\n` +
                    `Rewrite the long-form HTML body for this page. Return only the HTML body — H2/H3 structure, ` +
                    `but vary the heading wording and paragraph openings so this page does not match the skeleton of other pages on the site. ` +
                    `Minimum 500 words total. Cover, in your own order: a local-experience opener, the operational mix of services run from this area, ` +
                    `a comparison paragraph on why a local operator beats national breakdown cover, the geographic catchment around the area, ` +
                    `what actually happens when a driver calls, and a closing CTA. Apply every rule from the system prompt — ` +
                    `EAV sentences, real procedural detail, specific road references from the list above, no banned phrases.`,
                draftHtml: draft,
                area,
            });
        }
        update.bottom_content = final;
        fieldsUpdated.push('bottom_content');
    }

    update.updated_at = new Date();
    return { update, fieldsUpdated, audit };
}
