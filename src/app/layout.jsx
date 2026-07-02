import { Rubik } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { getSiteUrl } from "@/lib/siteUrl";
import { canonicalUrl, getCustomSchemaMarkup } from "@/lib/seoSettings";
import { SettingsProvider } from "@/components/SettingsProvider";
import FloatingActions from "@/components/FloatingActions";
import DeferredAnalytics from "@/components/DeferredAnalytics";
import SiteHeader from "@/components/SiteHeader";

// Rubik is a variable font: omitting `weight` serves ONE variable-axis file
// covering 300-900 instead of seven separate woff2 files.
const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
});

export async function generateMetadata() {
  const settings = await getSettings();
  const baseUrl = getSiteUrl();
  const homeCanonical = await canonicalUrl('/');

  return {
    metadataBase: new URL(baseUrl),
    title: "24 Hours Car Recovery Service In United Kingdom | 0736 054 4819",
    description: "Looking for a reliable car recovery and towing service in the UK? We offer 24/7 fast breakdown assistance and emergency towing near you. Call us now!",
    alternates: {
      canonical: homeCanonical,
    },
    openGraph: {
      title: "24 Hours Car Recovery Service In United Kingdom",
      description: "24/7 Emergency Car Recovery Service covering the entire UK.",
      url: baseUrl,
      siteName: "Car Recovery UK",
      images: [
        {
          url: '/tow-truck-hero.png',
          width: 1200,
          height: 630,
        },
      ],
      locale: 'en_GB',
      type: 'website',
    },
    twitter: {
      card: "summary_large_image",
      title: "24 Hours Car Recovery Service In United Kingdom",
      description: "Looking for a reliable car recovery and towing service in the UK? We offer 24/7 fast breakdown assistance and emergency towing near you. Call us now!",
    },
    icons: {
      icon: settings.favicon || "/truckicon.png",
    },
  };
}

export default async function RootLayout({ children }) {
  const settings = await getSettings();
  const baseUrl = getSiteUrl();
  const customSchema = await getCustomSchemaMarkup();

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Car Recovery UK",
    "url": baseUrl,
    "logo": (() => {
      const fav = settings.favicon || "/truckicon.png";
      return /^https?:\/\//i.test(fav) ? fav : `${baseUrl}${fav}`;
    })(),
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": settings.phone || "07360544819",
      "contactType": "emergency service",
      "areaServed": "GB",
      "availableLanguage": "en"
    },
    "sameAs": []
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Car Recovery UK",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/areas?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {customSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(customSchema) }}
          />
        )}
      </head>
      <body className={`${rubik.variable} font-sans antialiased`} suppressHydrationWarning>
        <SettingsProvider settings={settings}>
          <SiteHeader />
          {children}
          <FloatingActions />
          <DeferredAnalytics />
        </SettingsProvider>
      </body>
    </html>
  );
}
