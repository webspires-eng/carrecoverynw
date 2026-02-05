import Link from 'next/link';
import Footer from '@/components/Footer';

export default function BasicPage({ title, content }) {
    return (
        <main>
            <header style={{ padding: '20px', background: 'white', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/" style={{ fontSize: '1.2rem', fontWeight: '800', textDecoration: 'none', color: '#121212' }}>
                    CAR <span style={{ color: '#ed4705' }}>RECOVERY</span>
                </Link>
                <Link href="/" style={{ color: '#ed4705', fontWeight: '600' }}>← Back to Home</Link>
            </header>

            <section style={{ padding: '80px 5%', maxWidth: '1400px', margin: '0 auto', minHeight: '60vh' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '30px', color: '#012169' }}>{title}</h1>
                <div
                    className="basic-page-content"
                    style={{
                        lineHeight: '1.9',
                        color: '#444',
                        fontSize: '1.15rem',
                        hyphens: 'none'
                    }}
                >
                    {content}
                </div>
            </section>
            <Footer />
        </main>
    );
}

export function generateMetadata({ title }) {
    return {
        title: `${title} | Car Recovery UK`,
        robots: 'noindex, follow'
    }
}
