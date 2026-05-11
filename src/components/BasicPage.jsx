import Footer from '@/components/Footer';

export default function BasicPage({ title, content, schemaMarkup }) {
    return (
        <main>
            {schemaMarkup}
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
