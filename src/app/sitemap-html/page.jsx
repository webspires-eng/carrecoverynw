import { connectToDatabase } from '@/lib/db';
import BasicPage from '@/components/BasicPage';
import Link from 'next/link';
import '../../styles/sections/sitemap-html.css';

export const metadata = {
    title: 'HTML Sitemap | Car Recovery UK',
    description: 'A comprehensive list of all pages on the Car Recovery UK website.',
};

export default async function HtmlSitemap() {
    let areas = [];
    try {
        const { db } = await connectToDatabase();
        areas = await db.collection('areas')
            .find({ is_active: true }, { projection: { slug: 1, name: 1 } })
            .sort({ name: 1 })
            .toArray();
    } catch (e) {
        console.error('Sitemap DB error:', e);
    }

    const groupedAreas = areas.reduce((acc, area) => {
        const firstLetter = (area?.name?.[0] || '#').toUpperCase();
        if (!acc[firstLetter]) acc[firstLetter] = [];
        acc[firstLetter].push(area);
        return acc;
    }, {});

    const areaLetters = Object.keys(groupedAreas).sort((a, b) => a.localeCompare(b));

    return (
        <BasicPage
            title="HTML Sitemap"
            content={
                <div className="html-sitemap">
                    <section className="html-sitemap-hero">
                        <p className="html-sitemap-eyebrow">Quick Site Navigation</p>
                        <p className="html-sitemap-summary">
                            Browse every key page and service area from one place.
                            Looking for search engine XML data instead?
                            <Link href="/sitemap.xml"> Open the XML sitemap</Link>.
                        </p>
                        <div className="html-sitemap-meta">
                            <span>{6} core pages</span>
                            <span>{areas.length} active area pages</span>
                        </div>
                    </section>

                    <div className="html-sitemap-grid">
                        <div className="html-sitemap-card">
                            <h3>Main Pages</h3>
                            <ul className="html-sitemap-links">
                                <li><Link href="/">Home</Link></li>
                                <li><Link href="/about-us">About Us</Link></li>
                                <li><Link href="/contact-us">Contact Us</Link></li>
                                <li><Link href="/areas">Areas We Cover</Link></li>
                                <li><Link href="/sitemap">Sitemap (Grouped)</Link></li>
                                <li><Link href="/sitemap.xml">Sitemap XML</Link></li>
                            </ul>
                        </div>

                        <div className="html-sitemap-card">
                            <h3>Policies and Utility Pages</h3>
                            <ul className="html-sitemap-links">
                                <li><Link href="/privacy-policy">Privacy Policy</Link></li>
                                <li><Link href="/terms-of-service">Terms of Service</Link></li>
                                <li><Link href="/signin">Admin Sign In</Link></li>
                            </ul>
                        </div>
                    </div>

                    <section className="html-sitemap-card html-sitemap-areas">
                        <div className="html-sitemap-areas-header">
                            <h3>Areas Covered</h3>
                            <p>All currently active location pages are grouped alphabetically.</p>
                        </div>

                        {areaLetters.length === 0 ? (
                            <p className="html-sitemap-empty">No areas are available right now.</p>
                        ) : (
                            <div className="html-sitemap-letter-grid">
                                {areaLetters.map((letter) => (
                                    <div key={letter} className="html-sitemap-letter-group">
                                        <h4>{letter}</h4>
                                        <ul className="html-sitemap-links">
                                            {groupedAreas[letter].map((area) => (
                                                <li key={area.slug}>
                                                    <Link href={`/areas/${area.slug}`}>{area.name}</Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            }
        />
    );
}

export const revalidate = 3600; // Revalidate every hour
