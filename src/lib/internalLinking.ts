import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import { matchNameToSlug } from '@/lib/slugMatcher';

export type AreaLink = {
    name: string;
    slug: string;
    county: string;
    distanceKm: number;
};

export type SlugMap = Map<string, string>; // slug -> name

export type UpdateResult = {
    updatedPages: string[];
    skippedPages: string[];
    errors: string[];
};

const NEAREST_LIMIT = 6;
const REVERSE_LINK_RADIUS_KM = 25;
const REVALIDATE_BATCH = 10;
const EARTH_RADIUS_KM = 6371;

type AreaDoc = {
    _id?: unknown;
    slug: string;
    name: string;
    county?: string;
    latitude?: number;
    longitude?: number;
    is_active?: boolean;
    nearby_areas?: unknown;
    nearby_areas_slugs?: string[];
    internal_links_from?: string[];
};

function toRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

export function haversineKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

async function fetchActiveAreas(): Promise<AreaDoc[]> {
    const { db } = await connectToDatabase();
    const docs = await db
        .collection('areas')
        .find(
            { is_active: true },
            {
                projection: {
                    slug: 1,
                    name: 1,
                    county: 1,
                    latitude: 1,
                    longitude: 1,
                    nearby_areas: 1,
                    nearby_areas_slugs: 1,
                    internal_links_from: 1,
                },
            }
        )
        .toArray();
    return docs as unknown as AreaDoc[];
}

function hasGeo(area: AreaDoc): boolean {
    return (
        typeof area.latitude === 'number' &&
        typeof area.longitude === 'number' &&
        !Number.isNaN(area.latitude) &&
        !Number.isNaN(area.longitude)
    );
}

export async function calculateNearestAreas(slug: string): Promise<AreaLink[]> {
    const all = await fetchActiveAreas();
    const self = all.find((a) => a.slug === slug);
    if (!self || !hasGeo(self)) return [];

    return all
        .filter((a) => a.slug !== slug && hasGeo(a))
        .map((a) => ({
            name: a.name,
            slug: a.slug,
            county: a.county || '',
            distanceKm: haversineKm(
                self.latitude as number,
                self.longitude as number,
                a.latitude as number,
                a.longitude as number
            ),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, NEAREST_LIMIT);
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function generateNearbyAreasHTML(
    nearbyAreas: AreaLink[],
    currentAreaName: string
): string {
    if (nearbyAreas.length === 0) return '';
    const items = nearbyAreas
        .map((a) => {
            const name = escapeHtml(a.name);
            const slug = escapeHtml(a.slug);
            const county = escapeHtml(a.county);
            const dist = a.distanceKm.toFixed(1);
            return `<a class="nearby-area-card" href="/areas/${slug}" aria-label="Car recovery in ${name}">
    <span class="nearby-area-name">${name}</span>
    <span class="nearby-area-meta">${county} · ${dist} km</span>
</a>`;
        })
        .join('\n');

    return `<section class="nearby-areas-section">
<h2>Also Covering Nearby Areas</h2>
<p>Our team covers ${escapeHtml(currentAreaName)} and all surrounding locations.</p>
<div class="nearby-areas-grid">
${items}
</div>
</section>`;
}

export function injectLinksIntoSubAreasSection(
    areaData: { nearby_areas?: unknown; slug: string },
    allSlugs: SlugMap
): string {
    const raw = parseNearbyAreas(areaData.nearby_areas);
    if (raw.length === 0) return '';
    const slugList = Array.from(allSlugs.keys());

    return raw
        .map((name) => {
            const matched = matchNameToSlug(name, slugList);
            if (!matched || matched === areaData.slug) return escapeHtml(name);
            return `<a href="/areas/${matched}" aria-label="Car recovery in ${escapeHtml(name)}">${escapeHtml(name)}</a>`;
        })
        .join(', ');
}

function parseNearbyAreas(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean);
    }
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean);
            }
        } catch {
            // fall through to comma split
        }
        return value
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean);
    }
    return [];
}

export async function reverseLink_UpdateExistingPages(
    newSlug: string,
    newName: string,
    newLat: number,
    newLng: number
): Promise<UpdateResult> {
    const { db } = await connectToDatabase();
    const all = await fetchActiveAreas();
    const updatedPages: string[] = [];
    const skippedPages: string[] = [];
    const errors: string[] = [];

    for (const existing of all) {
        if (existing.slug === newSlug) continue;
        if (!hasGeo(existing)) {
            skippedPages.push(existing.slug);
            continue;
        }

        try {
            const distance = haversineKm(
                existing.latitude as number,
                existing.longitude as number,
                newLat,
                newLng
            );
            const currentSlugs = Array.isArray(existing.nearby_areas_slugs)
                ? existing.nearby_areas_slugs.slice()
                : [];

            let outboundChanged = false;

            if (distance < REVERSE_LINK_RADIUS_KM) {
                if (currentSlugs.length < NEAREST_LIMIT) {
                    if (!currentSlugs.includes(newSlug)) {
                        currentSlugs.push(newSlug);
                        outboundChanged = true;
                    }
                } else {
                    const sixthSlug = currentSlugs[NEAREST_LIMIT - 1];
                    const sixth = all.find((a) => a.slug === sixthSlug);
                    if (sixth && hasGeo(sixth)) {
                        const sixthDistance = haversineKm(
                            existing.latitude as number,
                            existing.longitude as number,
                            sixth.latitude as number,
                            sixth.longitude as number
                        );
                        if (distance < sixthDistance) {
                            currentSlugs.splice(NEAREST_LIMIT - 1, 1, newSlug);
                            outboundChanged = true;
                        }
                    }
                }
            }

            const mentionedAsText = parseNearbyAreas(existing.nearby_areas).some(
                (n) =>
                    matchNameToSlug(n, [newSlug]) === newSlug ||
                    n.trim().toLowerCase() === newName.trim().toLowerCase()
            );

            const inboundList = Array.isArray(existing.internal_links_from)
                ? existing.internal_links_from.slice()
                : [];
            const inboundChanged =
                mentionedAsText && !inboundList.includes(newSlug)
                    ? (inboundList.push(newSlug), true)
                    : false;

            if (!outboundChanged && !inboundChanged) {
                skippedPages.push(existing.slug);
                continue;
            }

            const update: Record<string, unknown> = { updated_at: new Date() };
            if (outboundChanged) update.nearby_areas_slugs = currentSlugs;
            if (inboundChanged) update.internal_links_from = inboundList;

            await db
                .collection('areas')
                .updateOne({ slug: existing.slug }, { $set: update });
            updatedPages.push(existing.slug);
        } catch (err) {
            errors.push(`${existing.slug}: ${(err as Error).message}`);
        }
    }

    return { updatedPages, skippedPages, errors };
}

export async function triggerISRRevalidation(slugs: string[]): Promise<void> {
    const unique = Array.from(new Set(slugs.filter(Boolean)));
    for (let i = 0; i < unique.length; i += REVALIDATE_BATCH) {
        const batch = unique.slice(i, i + REVALIDATE_BATCH);
        await Promise.all(
            batch.map(async (slug) => {
                const path = `/areas/${slug}`;
                try {
                    revalidatePath(path);
                    console.log(`[isr] revalidated ${path}`);
                } catch (err) {
                    console.warn(`[isr] failed ${path}: ${(err as Error).message}`);
                }
            })
        );
    }
    try {
        revalidatePath('/areas');
        revalidatePath('/');
    } catch (err) {
        console.warn(`[isr] failed root revalidation: ${(err as Error).message}`);
    }
}

export async function buildSlugMap(): Promise<SlugMap> {
    const all = await fetchActiveAreas();
    const map = new Map<string, string>();
    for (const a of all) map.set(a.slug, a.name);
    return map;
}

export async function getInboundLinkCount(slug: string): Promise<number> {
    const { db } = await connectToDatabase();
    return db.collection('areas').countDocuments({
        is_active: true,
        $or: [{ nearby_areas_slugs: slug }, { internal_links_from: slug }],
    });
}
