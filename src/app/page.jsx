import HomeHeroSection from "@/components/HomeHeroSection";
import HomeImmediateHelpSection from "@/components/HomeImmediateHelpSection";
import HomeStepsSection from "@/components/HomeStepsSection";
import HomeServicesSection from "@/components/HomeServicesSection";
import HomeCoverageSection from "@/components/HomeCoverageSection";
import HomeMapSection from "@/components/HomeMapSection";
import HomeTestimonialsSection from "@/components/HomeTestimonialsSection";
import HomeWhyChooseUsSection from "@/components/HomeWhyChooseUsSection";
import HomeServiceBoundaries from "@/components/HomeServiceBoundaries";
import HomePricingSection from "@/components/HomePricingSection";
import HomeRealRecoveriesSection from "@/components/HomeRealRecoveriesSection";
import HomeDamageFreeSection from "@/components/HomeDamageFreeSection";
import HomeSafetySection from "@/components/HomeSafetySection";
import HomeFAQSection from "@/components/HomeFAQSection";
import HomeFinalCTASection from "@/components/HomeFinalCTASection";
import Footer from "@/components/Footer";

import { getServices } from "@/lib/services";
// Recoveries data not needed anymore for HomeRealRecoveriesSection (it's static)
// but keeping import if future changes need it or for consistency

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const location = params.loc || "United Kingdom";
  const services = await getServices();
  // const recoveries = await getRecoveries(); // Not needed for static component

  return (
    <main>
      {/* 1. HERO + CTAs + Trust strip */}
      <HomeHeroSection location={location} />

      {/* 2. Broken Down Now? - Emergency micro-section */}
      <HomeImmediateHelpSection />

      {/* 3. Get Your Car Recovered in 3 Easy Steps */}
      <HomeStepsSection />

      {/* 4. Services - What we do */}
      <HomeServicesSection location={location} services={services} />

      {/* 5. Areas We Cover */}
      <HomeCoverageSection />

      {/* 6. Map + NAP */}
      <HomeMapSection />

      {/* 7. Reviews + Testimonials (unified) */}
      <HomeTestimonialsSection />

      {/* 8. Why Choose Us */}
      <HomeWhyChooseUsSection />

      {/* 9. Before We Dispatch - Service Boundaries */}
      <HomeServiceBoundaries />

      {/* 10. Transparent Pricing */}
      <HomePricingSection />

      {/* 11. Real Recoveries */}
      <HomeRealRecoveriesSection />

      {/* 12. Damage-Free Recovery */}
      <HomeDamageFreeSection />

      {/* 13. Safety Guide */}
      <HomeSafetySection />

      {/* 14. FAQs */}
      <HomeFAQSection />

      {/* 15. Final CTA */}
      <HomeFinalCTASection />

      <Footer />
    </main>
  );
}
