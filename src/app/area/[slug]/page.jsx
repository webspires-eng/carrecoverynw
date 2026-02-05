import { connectToDatabase } from '@/lib/db';
import { getServices } from "@/lib/services";
import { getRecoveries } from "@/lib/recoveries";
import { notFound } from 'next/navigation';
import HeroSection from "@/components/HeroSection";
import ImmediateHelpSection from "@/components/ImmediateHelpSection";
import StepsSection from "@/components/StepsSection";
import ServicesSection from "@/components/ServicesSection";
import CoverageSection from "@/components/CoverageSection";
import MapSection from "@/components/MapSection";
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

// Fetch area data from database
async function getAreaBySlug(slug) {
    try {
        const { db } = await connectToDatabase();
        const area = await db.collection('areas').findOne({ slug, is_active: true });
        return area || null;
    } catch (error) {
        console.error('Database error:', error);
        return null;
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

    return {
        title: area.meta_title || `24/7 Car Recovery in ${area.name} | Car Recovery UK`,
        description: area.meta_description || `Fast and reliable car recovery services in ${area.name}. Available 24/7 for breakdowns, accidents, and vehicle transport.`,
        openGraph: {
            title: area.meta_title || `24/7 Car Recovery in ${area.name}`,
            description: area.meta_description,
        },
    };
}

export default async function AreaPage({ params }) {
    const { slug } = await params;
    const area = await getAreaBySlug(slug);
    const services = await getServices();
    const recoveries = await getRecoveries();

    if (!area) {
        notFound();
    }

    const location = area.name;

    const majorRoads = area.major_roads ? (typeof area.major_roads === 'string' ? JSON.parse(area.major_roads) : area.major_roads) : [];
    const nearbyAreas = area.nearby_areas ? (typeof area.nearby_areas === 'string' ? JSON.parse(area.nearby_areas) : area.nearby_areas) : [];
    const customFaqs = area.custom_faqs ? (typeof area.custom_faqs === 'string' ? JSON.parse(area.custom_faqs) : area.custom_faqs) : [];

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
            {/* 1. HERO + CTAs + Trust strip */}
            <HeroSection location={location} />

            {/* 2. Broken Down Now? - Emergency micro-section */}
            <ImmediateHelpSection />

            {/* 3. Get Your Car Recovered in 3 Easy Steps */}
            <StepsSection />

            {/* 4. Services - What we do */}
            <ServicesSection location={location} majorRoads={majorRoads} services={displayServices} />

            {/* 5. Areas We Cover */}
            <CoverageSection location={location} majorRoads={majorRoads} nearbyAreas={nearbyAreas} />

            {/* 6. Map + NAP */}
            <MapSection location={location} />

            {/* 7. Reviews + Testimonials (unified) */}
            <TestimonialsSection location={location} />

            {/* 8. Why Choose Us */}
            <WhyChooseUsSection />

            {/* 9. Before We Dispatch - Service Boundaries */}
            <ServiceBoundaries />

            {/* 10. Transparent Pricing */}
            <PricingSection />

            {/* 11. Real Recoveries */}
            <RealRecoveriesSection location={location} majorRoads={majorRoads} recoveries={displayRecoveries} />

            {/* 11.5 Custom Extra Content */}
            <ExtraContentSection content={area.bottom_content} location={location} />

            {/* 12. Damage-Free Recovery */}
            <DamageFreeSection />

            {/* 13. Safety Guide */}
            <SafetySection />

            {/* 14. FAQs */}
            <FAQSection customFaqs={customFaqs} />

            {/* 15. Final CTA */}
            <FinalCTASection location={location} />

            <Footer />
        </main>
    );
}
