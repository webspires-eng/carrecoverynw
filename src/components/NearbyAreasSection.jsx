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
                <div className="nearby-areas-head">
                    <span className="nearby-areas-eyebrow">Service Coverage</span>
                    <h2>Also Covering Nearby Areas</h2>
                    <p>
                        Our recovery team covers <strong>{currentName}</strong> and all surrounding
                        locations — 24/7, with the same rapid response times.
                    </p>
                </div>
                <div className="nearby-areas-grid">
                    {items.map((a) => (
                        <Link
                            key={a.slug}
                            href={`/areas/${a.slug}`}
                            aria-label={`Car recovery in ${a.name}`}
                            className="nearby-area-card"
                        >
                            <span className="nearby-area-pin" aria-hidden="true">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            </span>
                            <span className="nearby-area-text">
                                <span className="nearby-area-name">{a.name}</span>
                                {a.county ? <span className="nearby-area-meta">{a.county}</span> : null}
                            </span>
                            <span className="nearby-area-arrow" aria-hidden="true">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
