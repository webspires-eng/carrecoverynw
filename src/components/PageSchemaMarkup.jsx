/**
 * PageSchemaMarkup — Outputs structured data for non-area pages
 * (home, about-us, contact-us, areas archive, privacy, terms).
 *
 * Props:
 *   pageType  – 'home' | 'about' | 'contact' | 'areas' | 'privacy' | 'terms'
 *   settings  – { business_name, phone, email, ... }
 */

export default function PageSchemaMarkup({ pageType, settings = {} }) {
    const baseUrl = process.env.SITE_URL || 'https://cartowingnearme.co.uk';
    const phone = settings.phone || '07360544819';
    const displayPhone = phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
    const email = settings.email || 'info@carrecoveryuk.co.uk';
    const businessName = settings.business_name || 'Car Recovery UK';
    const logoUrl = `${baseUrl}${settings.favicon || '/truckicon.png'}`;

    const schemas = [];

    // ── Organization (all pages) ──────────────────────────────
    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: businessName,
        url: baseUrl,
        logo: logoUrl,
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: displayPhone,
            contactType: 'emergency service',
            areaServed: 'GB',
            availableLanguage: 'en',
        },
        sameAs: [],
    };
    schemas.push(organizationSchema);

    // ── LocalBusiness (home, contact, about) ──────────────────
    if (['home', 'contact', 'about'].includes(pageType)) {
        schemas.push({
            '@context': 'https://schema.org',
            '@type': 'AutoRepair',
            '@id': `${baseUrl}/#localbusiness`,
            name: businessName,
            image: logoUrl,
            url: baseUrl,
            telephone: displayPhone,
            email: email,
            description: '24/7 emergency car recovery, breakdown assistance and vehicle towing service covering the West Midlands and beyond.',
            address: {
                '@type': 'PostalAddress',
                addressLocality: 'West Midlands',
                addressRegion: 'West Midlands',
                addressCountry: 'GB',
            },
            geo: {
                '@type': 'GeoCoordinates',
                latitude: 52.4862,
                longitude: -1.8904,
            },
            openingHoursSpecification: [{
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                opens: '00:00',
                closes: '23:59',
            }],
            priceRange: '££',
            sameAs: [],
        });
    }

    // ── Person (about page) ───────────────────────────────────
    if (pageType === 'about') {
        schemas.push({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'Car Recovery UK Team',
            jobTitle: 'Recovery Specialist',
            worksFor: { '@type': 'Organization', name: businessName },
            url: `${baseUrl}/about-us`,
            description: `Lead recovery specialist at ${businessName}, providing 24/7 emergency vehicle recovery across the West Midlands and beyond.`,
        });

        schemas.push({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: `About ${businessName} – 24/7 Car Recovery Specialists`,
            description: 'Learn more about the UK\'s most reliable 24/7 vehicle recovery and breakdown service.',
            image: `${baseUrl}/tow-truck-hero.png`,
            author: { '@type': 'Organization', name: businessName, url: baseUrl },
            publisher: { '@type': 'Organization', name: businessName, logo: { '@type': 'ImageObject', url: logoUrl } },
            url: `${baseUrl}/about-us`,
            mainEntityOfPage: { '@type': 'WebPage', '@id': `${baseUrl}/about-us` },
            datePublished: '2025-01-01T00:00:00+00:00',
            dateModified: new Date().toISOString(),
            inLanguage: 'en-GB',
        });
    }

    // ── HowTo (home page) ─────────────────────────────────────
    if (pageType === 'home') {
        schemas.push({
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: 'How to Get Emergency Car Recovery in the UK',
            description: 'Follow these simple steps to get fast, professional car recovery anywhere in the UK. Available 24/7 with typical arrival in under 30 minutes.',
            totalTime: 'PT30M',
            step: [
                { '@type': 'HowToStep', position: 1, name: 'Contact and Dispatch', text: `Call ${displayPhone} or send your live location via WhatsApp. Our team will instantly locate the nearest recovery vehicle to your position.` },
                { '@type': 'HowToStep', position: 2, name: 'Secure Towing', text: 'Our specialist flatbed recovery truck arrives and securely loads your vehicle for damage-free transport.' },
                { '@type': 'HowToStep', position: 3, name: 'Transparent Billing', text: 'Receive a clear, upfront price before recovery begins. Pay via card, cash, or bank transfer with a full receipt provided.' },
            ],
        });

        // FAQPage for home
        const homeFaqs = [
            { q: 'How fast can you reach me?', a: 'We typically arrive within 15 to 30 minutes depending on your location. Our nationwide network ensures the local driver nearest to you is sent immediately.' },
            { q: 'Do you cover motorway recovery?', a: 'Yes, we specialize in emergency motorway recovery on all major UK motorways (M1, M6, M25, M5, etc). We prioritize motorway call-outs due to safety risks.' },
            { q: 'Can you recover low cars or sports cars damage-free?', a: 'Yes, we use specialized flatbed recovery trucks and ramps designed for low-clearance vehicles to ensure 100% damage-free loading.' },
            { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards, bank transfers, and cash. You will receive a full receipt for your insurance or records.' },
            { q: 'Are you available 24/7 including bank holidays?', a: 'Yes, we are open 24 hours a day, 365 days a year, including Christmas Day, New Year, and all Bank Holidays.' },
            { q: 'How much does car recovery cost?', a: 'Costs depend on distance and complexity. We provide a firm quote before we dispatch, so you know exactly what you\'ll pay with no hidden fees.' },
        ];

        schemas.push({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: homeFaqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
        });

        schemas.push({
            '@context': 'https://schema.org',
            '@type': 'QAPage',
            mainEntity: homeFaqs.map(f => ({ '@type': 'Question', name: f.q, answerCount: 1, acceptedAnswer: { '@type': 'Answer', text: f.a, upvoteCount: 0 } })),
        });
    }

    // ── Contact page specific ─────────────────────────────────
    if (pageType === 'contact') {
        schemas.push({
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: `Contact ${businessName}`,
            description: 'Get in touch with us for 24/7 emergency car recovery and towing services.',
            url: `${baseUrl}/contact-us`,
            mainEntity: {
                '@type': 'Organization',
                name: businessName,
                telephone: displayPhone,
                email: email,
            },
        });
    }

    // ── Areas archive ─────────────────────────────────────────
    if (pageType === 'areas') {
        schemas.push({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Areas We Cover | Car Recovery UK',
            description: 'Find car recovery services in your area. We cover Birmingham, Coventry, Wolverhampton, and 4000+ locations across the West Midlands.',
            url: `${baseUrl}/areas`,
            isPartOf: { '@type': 'WebSite', name: businessName, url: baseUrl },
        });
    }

    // ── BreadcrumbList ────────────────────────────────────────
    const breadcrumbMap = {
        home: [{ name: 'Home', url: baseUrl }],
        about: [{ name: 'Home', url: baseUrl }, { name: 'About Us', url: `${baseUrl}/about-us` }],
        contact: [{ name: 'Home', url: baseUrl }, { name: 'Contact Us', url: `${baseUrl}/contact-us` }],
        areas: [{ name: 'Home', url: baseUrl }, { name: 'Areas We Cover', url: `${baseUrl}/areas` }],
        privacy: [{ name: 'Home', url: baseUrl }, { name: 'Privacy Policy', url: `${baseUrl}/privacy-policy` }],
        terms: [{ name: 'Home', url: baseUrl }, { name: 'Terms of Service', url: `${baseUrl}/terms-of-service` }],
    };

    if (breadcrumbMap[pageType]) {
        schemas.push({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbMap[pageType].map((item, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: item.name,
                item: item.url,
            })),
        });
    }

    return (
        <>
            {schemas.map((schema, i) => (
                <script
                    key={`page-schema-${i}`}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
        </>
    );
}
