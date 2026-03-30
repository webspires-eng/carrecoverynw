/**
 * AreaSchemaMarkup — Server component that outputs structured data (JSON-LD)
 * for every area page.  Covers the types the user requested:
 *   FAQPage  – already handled in FAQSection, but we include it here as well
 *              so every area page is self-contained.
 *   HowTo    – "How to get car recovery in {location}"
 *   Article  – long-form service article for the area
 *   QAPage   – mirrors the FAQ data in the Google Q&A rich-result format
 *   Organization – business identity (NAP + logo)
 *   Person   – founder / main driver
 *   LocalBusiness – full local-business listing with geo, hours, services
 */

export default function AreaSchemaMarkup({ area, faqs = [], settings = {} }) {
    const baseUrl = process.env.SITE_URL || 'https://cartowingnearme.co.uk';
    const location = area.name;
    const slug = area.slug;
    const pageUrl = `${baseUrl}/areas/${slug}`;
    const phone = settings.phone || '07360544819';
    const displayPhone = phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
    const email = settings.email || 'info@carrecoveryuk.co.uk';
    const businessName = settings.business_name || 'Car Recovery UK';
    const logoUrl = `${baseUrl}${settings.favicon || '/truckicon.png'}`;

    const majorRoads = area.major_roads
        ? (typeof area.major_roads === 'string' ? JSON.parse(area.major_roads) : area.major_roads)
        : [];
    const majorRoadsStr = majorRoads.length > 0 ? majorRoads.slice(0, 3).join('/') : 'M6/M5/M42';

    // ── helpers ───────────────────────────────────────────────
    const replacePlaceholders = (str) =>
        (str || '')
            .replace(/\{\{location\}\}/g, location)
            .replace(/\{\{majorRoads\}\}/g, majorRoadsStr);

    const displayFaqs = faqs.map(f => ({
        q: replacePlaceholders(f.question || f.q),
        a: replacePlaceholders(f.answer || f.a),
    }));

    // ── 1. LocalBusiness ──────────────────────────────────────
    const localBusinessSchema = {
        '@context': 'https://schema.org',
        '@type': 'AutoRepair',
        '@id': `${baseUrl}/#localbusiness`,
        name: `${businessName} – ${location}`,
        image: logoUrl,
        url: pageUrl,
        telephone: displayPhone,
        email: email,
        description: area.meta_description || `24/7 car recovery, breakdown assistance and vehicle towing in ${location}. Fast, reliable service covering ${location} and surrounding areas.`,
        address: {
            '@type': 'PostalAddress',
            addressLocality: location,
            addressRegion: area.county || 'West Midlands',
            addressCountry: 'GB',
        },
        geo: area.latitude && area.longitude
            ? {
                '@type': 'GeoCoordinates',
                latitude: area.latitude,
                longitude: area.longitude,
            }
            : undefined,
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                    'Monday', 'Tuesday', 'Wednesday', 'Thursday',
                    'Friday', 'Saturday', 'Sunday',
                ],
                opens: '00:00',
                closes: '23:59',
            },
        ],
        priceRange: '££',
        areaServed: {
            '@type': 'GeoCircle',
            geoMidpoint: {
                '@type': 'GeoCoordinates',
                latitude: area.latitude || 52.4862,
                longitude: area.longitude || -1.8904,
            },
            geoRadius: '30000',
        },
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Car Recovery Services',
            itemListElement: [
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: `Emergency Car Recovery in ${location}`,
                    },
                },
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: `Vehicle Towing in ${location}`,
                    },
                },
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: `Breakdown Assistance in ${location}`,
                    },
                },
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: `Flatbed Recovery in ${location}`,
                    },
                },
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: `Jump Start Service in ${location}`,
                    },
                },
            ],
        },
        sameAs: [],
    };

    // ── 2. Organization ───────────────────────────────────────
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

    // ── 3. Person (founder / lead operator) ───────────────────
    const personSchema = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Car Recovery UK Team',
        jobTitle: 'Recovery Specialist',
        worksFor: {
            '@type': 'Organization',
            name: businessName,
        },
        url: `${baseUrl}/about-us`,
        description: `Lead recovery specialist at ${businessName}, providing 24/7 emergency vehicle recovery across the West Midlands and beyond.`,
    };

    // ── 4. Article ────────────────────────────────────────────
    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: area.meta_title || `24/7 Car Recovery in ${location}`,
        description: area.meta_description || `Complete guide to car recovery services in ${location}. Emergency towing, breakdown assistance, and vehicle transport available 24/7.`,
        image: `${baseUrl}/tow-truck-hero.png`,
        author: {
            '@type': 'Organization',
            name: businessName,
            url: baseUrl,
        },
        publisher: {
            '@type': 'Organization',
            name: businessName,
            logo: {
                '@type': 'ImageObject',
                url: logoUrl,
            },
        },
        url: pageUrl,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': pageUrl,
        },
        datePublished: '2025-01-01T00:00:00+00:00',
        dateModified: new Date().toISOString(),
        articleSection: 'Car Recovery Services',
        inLanguage: 'en-GB',
    };

    // ── 5. HowTo ──────────────────────────────────────────────
    const howToSchema = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: `How to Get Emergency Car Recovery in ${location}`,
        description: `Follow these simple steps to get fast, professional car recovery in ${location}. Available 24/7 with typical arrival in under 30 minutes.`,
        totalTime: 'PT30M',
        estimatedCost: {
            '@type': 'MonetaryAmount',
            currency: 'GBP',
            value: '0',
        },
        step: [
            {
                '@type': 'HowToStep',
                position: 1,
                name: 'Contact and Dispatch',
                text: `Call ${displayPhone} or send your live location via WhatsApp. Our team will instantly locate the nearest recovery vehicle to your position in ${location}.`,
                url: `${pageUrl}#steps`,
            },
            {
                '@type': 'HowToStep',
                position: 2,
                name: 'Secure Towing',
                text: `Our specialist flatbed recovery truck arrives at your location in ${location} and securely loads your vehicle for damage-free transport.`,
                url: `${pageUrl}#steps`,
            },
            {
                '@type': 'HowToStep',
                position: 3,
                name: 'Transparent Billing',
                text: 'Receive a clear, upfront price before recovery begins. Pay via card, cash, or bank transfer with a full receipt provided.',
                url: `${pageUrl}#steps`,
            },
        ],
    };

    // ── 6. FAQPage ────────────────────────────────────────────
    const faqPageSchema = displayFaqs.length > 0
        ? {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: displayFaqs.map(faq => ({
                '@type': 'Question',
                name: faq.q,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.a,
                },
            })),
        }
        : null;

    // ── 7. QAPage ─────────────────────────────────────────────
    const qaPageSchema = displayFaqs.length > 0
        ? {
            '@context': 'https://schema.org',
            '@type': 'QAPage',
            mainEntity: displayFaqs.map(faq => ({
                '@type': 'Question',
                name: faq.q,
                answerCount: 1,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.a,
                    upvoteCount: 0,
                },
            })),
        }
        : null;

    // ── 8. BreadcrumbList ─────────────────────────────────────
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: baseUrl,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Areas We Cover',
                item: `${baseUrl}/areas`,
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: `Car Recovery ${location}`,
                item: pageUrl,
            },
        ],
    };

    // ── 9. Service schema ─────────────────────────────────────
    const serviceSchema = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: `Car Recovery in ${location}`,
        description: `Professional 24/7 car recovery, towing, and breakdown assistance in ${location} and surrounding areas.`,
        provider: {
            '@type': 'Organization',
            name: businessName,
            url: baseUrl,
        },
        areaServed: {
            '@type': 'Place',
            name: location,
        },
        serviceType: 'Emergency Vehicle Recovery',
        url: pageUrl,
    };

    // Collect all schemas, filter out nulls
    const schemas = [
        localBusinessSchema,
        organizationSchema,
        personSchema,
        articleSchema,
        howToSchema,
        faqPageSchema,
        qaPageSchema,
        breadcrumbSchema,
        serviceSchema,
    ].filter(Boolean);

    return (
        <>
            {schemas.map((schema, i) => (
                <script
                    key={`schema-${i}`}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
        </>
    );
}
