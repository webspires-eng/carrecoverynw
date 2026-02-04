import Link from 'next/link';
import { connectToDatabase } from '@/lib/db';
import '../../styles/sections/sitemap.css';

export const metadata = {
    title: 'Sitemap | Car Recovery UK',
    description: 'Overview of all pages on our website.'
};

async function getAreas() {
    try {
        const { db } = await connectToDatabase();
        const rows = await db.collection('areas')
            .find({ is_active: true }, { projection: { name: 1, slug: 1 } })
            .sort({ name: 1 })
            .toArray();
        return rows;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export default async function SitemapPage() {
    const areas = await getAreas();

    // Group areas by letter
    const grouped = areas.reduce((acc, area) => {
        const letter = area.name[0].toUpperCase();
        if (!acc[letter]) acc[letter] = [];
        acc[letter].push(area);
        return acc;
    }, {});

    const letters = Object.keys(grouped).sort();

    return (
        <main className="sitemap-container">
            <h1 className="sitemap-h1">Sitemap</h1>

            <div className="sitemap-section">
                <h2 className="sitemap-h2">Main Navigation</h2>
                <ul className="sitemap-links">
                    <li><Link href="/">Home</Link></li>
                    <li><Link href="/areas">Areas We Cover (Full Archive)</Link></li>
                    <li><Link href="/signin">Admin Login</Link></li>
                </ul>
            </div>

            <div className="sitemap-section">
                <h2 className="sitemap-h2">Service Areas</h2>
                <div className="sitemap-areas-grid">
                    {letters.map(letter => (
                        <div key={letter} className="letter-group">
                            <h3>{letter}</h3>
                            <ul className="sitemap-links">
                                {grouped[letter].map(area => (
                                    <li key={area.slug}>
                                        <Link href={`/area/${area.slug}`}>
                                            Car Recovery {area.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
