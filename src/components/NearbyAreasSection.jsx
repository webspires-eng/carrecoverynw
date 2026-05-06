import Link from 'next/link';
import { connectToDatabase } from '@/lib/db';
import '../styles/sections/nearby-areas.css';

async function fetchAreasBySlugs(slugs) {
    if (!slugs || slugs.length === 0) return [];
    try {
        const { db } = await connectToDatabase();
        const docs = await db
            .collection('areas')
            .find(
                { slug: { $in: slugs }, is_active: true },
                { projection: { _id: 0, slug: 1, name: 1, county: 1 } }
            )
            .toArray();
        const bySlug = new Map(docs.map((d) => [d.slug, d]));
        return slugs.map((s) => bySlug.get(s)).filter(Boolean);
    } catch (err) {
        console.error('NearbyAreasSection: failed to load slugs', err);
        return [];
    }
}

export default async function NearbyAreasSection({ currentSlug, currentName, nearbyAreasSlugs }) {
    const items = await fetchAreasBySlugs(
        (nearbyAreasSlugs || []).filter((s) => s && s !== currentSlug)
    );
    if (items.length === 0) return null;

    return (
        <section className="nearby-areas-section">
            <div className="nearby-areas-content">
                <h2>Also Covering Nearby Areas</h2>
                <p>Our team covers {currentName} and all surrounding locations.</p>
                <div className="nearby-areas-grid">
                    {items.map((a) => (
                        <Link
                            key={a.slug}
                            href={`/areas/${a.slug}`}
                            aria-label={`Car recovery in ${a.name}`}
                            className="nearby-area-card"
                        >
                            <span className="nearby-area-name">{a.name}</span>
                            {a.county ? <span className="nearby-area-meta">{a.county}</span> : null}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
