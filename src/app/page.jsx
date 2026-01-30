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
import FinalCTASection from "@/components/FinalCTASection";
import Footer from "@/components/Footer";

import { getServices } from "@/lib/services";

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const location = params.loc || "West Midlands";
  const services = await getServices();

  return (
    <main>
      {/* 1. HERO + CTAs + Trust strip */}
      <HeroSection location={location} />

      {/* 2. Broken Down Now? - Emergency micro-section */}
      <ImmediateHelpSection />

      {/* 3. Get Your Car Recovered in 3 Easy Steps */}
      <StepsSection />

      {/* 4. Services - What we do */}
      <ServicesSection location={location} services={services} />

      {/* 5. Areas We Cover */}
      <CoverageSection />

      {/* 6. Map + NAP */}
      <MapSection />

      {/* 7. Reviews + Testimonials (unified) */}
      <TestimonialsSection />

      {/* 8. Why Choose Us */}
      <WhyChooseUsSection />

      {/* 9. Before We Dispatch - Service Boundaries */}
      <ServiceBoundaries />

      {/* 10. Transparent Pricing */}
      <PricingSection />

      {/* 11. Real Recoveries */}
      <RealRecoveriesSection />

      {/* 12. Damage-Free Recovery */}
      <DamageFreeSection />

      {/* 13. Safety Guide */}
      <SafetySection />

      {/* 14. FAQs */}
      <FAQSection />

      {/* 15. Final CTA */}
      <FinalCTASection />

      <Footer />
    </main>
  );
}
