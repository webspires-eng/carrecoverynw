import { connectToDatabase } from '@/lib/db';
import { getServices } from "@/lib/services";
import { getRecoveries } from "@/lib/recoveries";
import { getSettings } from "@/lib/settings";
import { getAllActiveSlugs } from "@/lib/areas";
import { notFound } from 'next/navigation';
import HeroSection from "@/components/HeroSection";
import LocalKnowledgeSection from "@/components/LocalKnowledgeSection";
import ImmediateHelpSection from "@/components/ImmediateHelpSection";
import StepsSection from "@/components/StepsSection";
import ServicesSection from "@/components/ServicesSection";
import CoverageSection from "@/components/CoverageSection";
import NearbyAreasSection from "@/components/NearbyAreasSection";
import MapSection from "@/components/MapSection";
import AreaSchemaMarkup from "@/components/AreaSchemaMarkup";
import TestimonialsSection from "@/components/TestimonialsSection";
import WhyChooseUsSection from "@/components/WhyChooseUsSection";
import ServiceBoundaries from "@/components/ServiceBoundaries";
import PricingSection from "@/components/PricingSection";
import RealRecoveriesSection from "@/components/RealRecoveriesSection";
import DamageFreeSection from "@/components/DamageFreeSection";
import SafetySection from "@/components/SafetySection";
import FAQSection from "@/components/FAQSection";
import ExtraContentSection from "@/components/ExtraContentSection";
import FinalCTASection from "@/components/FinalCTASection";
import Footer from "@/components/Footer";
import { getSiteUrl } from '@/lib/siteUrl';
import { canonicalUrl } from '@/lib/seoSettings';

// Fetch area data from database
async function getAreaBySlug(slug) {
    try {
        const { db } = await connectToDatabase();
        const area = await db.collection('areas').findOne({ slug, is_active: true });
        if (area) {
            area._id = area._id.toString();
        }
        return area || null;
    } catch (error) {
        // Rethrow rather than returning null: a transient DB failure during
        // static generation must fail the build, not silently prerender this
        // slug as a 404 page that then deploys.
        console.error('Database error for slug', slug, error);
        throw error;
    }
}

// Generate static params for all active areas (for static generation)
export async function generateStaticParams() {
    try {
        const { db } = await connectToDatabase();
        const rows = await db.collection('areas')
            .find({ is_active: true }, { projection: { slug: 1 } })
            .toArray();
        return rows.map((row) => ({
            slug: row.slug,
        }));
    } catch (error) {
        console.error('Error generating static params:', error);
        return [];
    }
}

// Generate metadata for each area page
export async function generateMetadata({ params }) {
    const { slug } = await params;
    const area = await getAreaBySlug(slug);

    if (!area) {
        return {
            title: 'Area Not Found | Car Recovery UK',
        };
    }

    const baseUrl = getSiteUrl();
    const canonical = await canonicalUrl(`/areas/${slug}`);

    const BRAND_SUFFIX = "| Car Recovery UK";
    const rawTitle = area.meta_title?.trim() || `24/7 Car Recovery in ${area.name}`;
    const fullTitle = rawTitle.toLowerCase().includes("car recovery uk")
        ? rawTitle
        : `${rawTitle} ${BRAND_SUFFIX}`;
    const description = area.meta_description
        || `Fast and reliable 24/7 car recovery in ${area.name}. Emergency breakdown assistance, towing, and vehicle transport across ${area.name} and surrounding areas.`;

    return {
        title: fullTitle,
        description: description,
        alternates: {
            canonical: canonical,
        },
        // Thin pages can be excluded from the index (but still crawled/followed)
        // by setting noindex: true on the area doc — see scripts/set-noindex.mjs.
        ...(area.noindex ? { robots: { index: false, follow: true } } : {}),
        openGraph: {
            title: fullTitle,
            description: description,
            url: canonical,
            siteName: "Car Recovery UK",
            images: [
                {
                    url: `/api/og?city=${encodeURIComponent(area.name)}`,
                    width: 1200,
                    height: 630,
                    alt: `Car Recovery in ${area.name}`
                },
            ],
            locale: 'en_GB',
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description: description,
            images: [`/api/og?city=${encodeURIComponent(area.name)}`],
        },
    };
}

export default async function AreaPage({ params }) {
    const { slug } = await params;
    const [area, services, recoveries, settings, allActiveSlugs] = await Promise.all([
        getAreaBySlug(slug),
        getServices(),
        getRecoveries(),
        getSettings(),
        getAllActiveSlugs(),
    ]);

    if (!area) {
        notFound();
    }

    const location = area.name;

    const majorRoads = area.major_roads ? (typeof area.major_roads === 'string' ? JSON.parse(area.major_roads) : area.major_roads) : [];
    const nearbyAreas = area.nearby_areas ? (typeof area.nearby_areas === 'string' ? JSON.parse(area.nearby_areas) : area.nearby_areas) : [];
    const customFaqs = area.custom_faqs ? (typeof area.custom_faqs === 'string' ? JSON.parse(area.custom_faqs) : area.custom_faqs) : [];

    // Build the FAQ list for schema (use custom or default)
    const defaultFaqs = [
        { q: `How fast can you reach me in ${area.name}?`, a: "We typically arrive within 15 to 30 minutes depending on your location. Our local dispatch system ensures the nearest driver is sent to you immediately." },
        { q: "Can you recover low cars or sports cars damage-free?", a: "Yes, we use specialized flatbed recovery trucks and ramps designed for low-clearance vehicles to ensure 100% damage-free loading." },
        { q: "Can you tow my car to any garage or home address?", a: "Yes, we can recover your vehicle to any destination of your choice, whether it's your home address, a preferred local garage, or a dealership." },
        { q: "What payment methods do you accept?", a: "We accept all major credit/debit cards, bank transfers, and cash. You will receive a full receipt for your insurance or records." },
        { q: "Are you available 24/7 including bank holidays?", a: "Yes, we are open 24 hours a day, 365 days a year, including Christmas Day, New Year, and all Bank Holidays." },
        { q: `How much does car recovery cost in ${area.name}?`, a: "Costs depend on distance and complexity. We provide a firm quote before we dispatch, so you know exactly what you'll pay." },
    ];
    const schemaFaqs = (customFaqs && customFaqs.length > 0) ? customFaqs : defaultFaqs;

    // Prioritize area-specific services if they exist
    const displayServices = area.custom_services
        ? (typeof area.custom_services === 'string' ? JSON.parse(area.custom_services) : area.custom_services)
        : services;

    // Prioritize area-specific recoveries if they exist
    const displayRecoveries = area.custom_recoveries
        ? (typeof area.custom_recoveries === 'string' ? JSON.parse(area.custom_recoveries) : area.custom_recoveries)
        : recoveries;

    return (
        <main>
            {/* Schema Markup — all structured data for this area page */}
            <AreaSchemaMarkup area={area} faqs={schemaFaqs} settings={settings} />

            {/* 1. HERO + CTAs + Trust strip — unique per-city H1 + intro when set */}
            <HeroSection
                location={location}
                title={area.h1_title || ""}
                intro={area.intro_text || ""}
            />

            {/* 2. Broken Down Now? - Emergency micro-section */}
            <ImmediateHelpSection settings={settings} />

            {/* 3. Get Your Car Recovered in 3 Easy Steps */}
            <StepsSection settings={settings} />

            {/* 4. Services - What we do */}
            <ServicesSection location={location} majorRoads={majorRoads} services={displayServices} />

            {/* 5. Areas We Cover */}
            <CoverageSection
                location={location}
                majorRoads={majorRoads}
                nearbyAreas={nearbyAreas}
                allActiveSlugs={allActiveSlugs}
                currentSlug={slug}
            />

            {/* 5b. Auto-linked nearest neighbours (computed at publish time) */}
            <NearbyAreasSection
                currentSlug={slug}
                currentName={area.name}
                nearbyAreasSlugs={Array.isArray(area.nearby_areas_slugs) ? area.nearby_areas_slugs : []}
            />

            {/* 5c. Genuinely local knowledge (postcodes, landmarks, unique copy).
                Renders nothing until the fields are filled via the content worksheet. */}
            <LocalKnowledgeSection
                location={location}
                postcodeDistricts={Array.isArray(area.postcode_districts) ? area.postcode_districts : []}
                landmarks={Array.isArray(area.local_landmarks) ? area.local_landmarks : []}
                localNotes={area.local_notes || ""}
            />

            {/* 6. Map + NAP */}
            <MapSection location={location} settings={settings} />

            {/* 7. Reviews + Testimonials (unified) */}
            <TestimonialsSection location={location} />

            {/* 8. Why Choose Us */}
            <WhyChooseUsSection settings={settings} />

            {/* 9. Before We Dispatch - Service Boundaries */}
            <ServiceBoundaries />

            {/* 10. Transparent Pricing */}
            <PricingSection settings={settings} />

            {/* 11. Real Recoveries */}
            <RealRecoveriesSection location={location} majorRoads={majorRoads} recoveries={displayRecoveries} />

            {/* 11.5 Custom Extra Content */}
            <ExtraContentSection content={area.bottom_content} location={location} majorRoads={majorRoads} />

            {/* 12. Damage-Free Recovery */}
            <DamageFreeSection />

            {/* 13. Safety Guide */}
            <SafetySection />

            {/* 14. FAQs */}
            <FAQSection customFaqs={customFaqs} location={location} majorRoads={majorRoads} />

            {/* 15. Final CTA */}
            <FinalCTASection location={location} settings={settings} />

            <Footer settings={settings} />
        </main>
    );
}

// Fully static: area content (town name, phone, copy) only changes on a code
// edit + redeploy, so there is NO time-based ISR. Each page is rebuilt only at
// deploy time. For content edits without a deploy, call
// revalidatePath('/areas/<slug>') on demand (see /api/admin/revalidate-all).
export const revalidate = false;

// Only slugs returned by generateStaticParams() are valid. Unknown/bot-generated
// URLs (e.g. /areas/random-junk) return 404 instead of triggering on-demand ISR
// generation + a write. generateStaticParams() already returns every active slug.
export const dynamicParams = false;
