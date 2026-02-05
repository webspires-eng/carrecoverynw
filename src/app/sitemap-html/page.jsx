import { connectToDatabase } from '@/lib/db';
import BasicPage from '@/components/BasicPage';
import Link from 'next/link';

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

    return (
        <BasicPage
            title="Site Map"
            content={
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '40px' }}>
                    <div>
                        <h3 style={{ marginBottom: '15px', color: '#ed4705' }}>Main Pages</h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li style={{ marginBottom: '10px' }}><Link href="/">Home</Link></li>
                            <li style={{ marginBottom: '10px' }}><Link href="/about-us">About Us</Link></li>
                            <li style={{ marginBottom: '10px' }}><Link href="/contact-us">Contact Us</Link></li>
                            <li style={{ marginBottom: '10px' }}><Link href="/areas">Areas We Cover</Link></li>
                            <li style={{ marginBottom: '10px' }}><Link href="/privacy-policy">Privacy Policy</Link></li>
                            <li style={{ marginBottom: '10px' }}><Link href="/terms-of-service">Terms of Service</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 style={{ marginBottom: '15px', color: '#ed4705' }}>Areas Covered</h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {areas.map(area => (
                                <li key={area.slug} style={{ marginBottom: '10px' }}>
                                    <Link href={`/area/${area.slug}`}>{area.name}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            }
        />
    );
}

export const revalidate = 3600; // Revalidate every hour
