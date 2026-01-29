import pool from '@/lib/db';
import Link from 'next/link';
import '../../styles/sections/areas-archive.css';

// Fetch all areas
async function getAreas(search = '') {
    try {
        let query = 'SELECT slug, name, county, region FROM areas WHERE is_active = 1';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR county LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY name ASC';
        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('Database error:', error);
        return [];
    }
}

export const metadata = {
    title: 'Areas We Cover | ABZ Car Recovery',
    description: 'Find car recovery services in your area. We cover Birmingham, Coventry, Wolverhampton, and 4000+ locations across the West Midlands.'
};

export default async function AreasArchive({ searchParams }) {
    const params = await searchParams;
    const search = params.q || '';
    const areas = await getAreas(search);

    // Group areas by first letter
    const groupedAreas = areas.reduce((acc, area) => {
        const letter = area.name[0].toUpperCase();
        if (!acc[letter]) acc[letter] = [];
        acc[letter].push(area);
        return acc;
    }, {});

    const letters = Object.keys(groupedAreas).sort();

    return (
        <main className="areas-archive">
            <div className="areas-hero">
                <h1>Areas We Cover</h1>
                <p>24/7 Car Recovery Services Across the West Midlands & Beyond</p>

                <form className="areas-search" action="/areas" method="GET">
                    <input
                        type="text"
                        name="q"
                        placeholder="Search your area..."
                        defaultValue={search}
                    />
                    <button type="submit">Search</button>
                </form>
            </div>

            <div className="areas-container">
                <div className="areas-stats">
                    <span>Showing <strong>{areas.length}</strong> areas</span>
                    {search && <span> for "{search}"</span>}
                </div>

                <div className="letter-nav">
                    {letters.map(letter => (
                        <a key={letter} href={`#letter-${letter}`}>{letter}</a>
                    ))}
                </div>

                <div className="areas-list">
                    {letters.map(letter => (
                        <div key={letter} id={`letter-${letter}`} className="letter-group">
                            <h2>{letter}</h2>
                            <div className="areas-grid">
                                {groupedAreas[letter].map(area => (
                                    <Link
                                        key={area.slug}
                                        href={`/area/${area.slug}`}
                                        className="area-link"
                                    >
                                        <span className="area-name">{area.name}</span>
                                        {area.county && <span className="area-county">{area.county}</span>}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {areas.length === 0 && (
                    <div className="no-results">
                        <p>No areas found for "{search}"</p>
                        <Link href="/areas">View all areas</Link>
                    </div>
                )}
            </div>
        </main>
    );
}
