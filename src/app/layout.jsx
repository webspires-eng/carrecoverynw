import { Rubik } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { SettingsProvider } from "@/components/SettingsProvider";
import FloatingActions from "@/components/FloatingActions";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export async function generateMetadata() {
  const settings = await getSettings();
  const baseUrl = process.env.SITE_URL || 'https://cartowingnearme.co.uk';

  return {
    metadataBase: new URL(baseUrl),
    title: "24 Hours Car Recovery Service In West Midlands & Outskirts | 0736 054 4819",
    description: "24/7 Emergency Car Recovery Service covering the entire UK. Arrive in less than 15 minutes. Call 0736 054 4819 for immediate assistance.",
    keywords: "car recovery, emergency towing, 24/7 recovery, UK car recovery, roadside assistance, vehicle transport",
    alternates: {
      canonical: './',
    },
    openGraph: {
      title: "24 Hours Car Recovery Service In West Midlands",
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
      card: 'summary_large_image',
      title: "24 Hours Car Recovery Service In West Midlands",
      description: "24/7 Emergency Car Recovery Service covering the entire UK.",
      images: ['/tow-truck-hero.png'],
    },
    icons: {
      icon: settings.favicon || "/truckicon.png",
    },
  };
}

export default async function RootLayout({ children }) {
  const settings = await getSettings();
  const baseUrl = process.env.SITE_URL || 'https://cartowingnearme.co.uk';

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Car Recovery UK",
    "url": baseUrl,
    "logo": `${baseUrl}${settings.favicon || "/truckicon.png"}`,
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
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={`${rubik.variable} font-sans antialiased`} suppressHydrationWarning>
        <SettingsProvider settings={settings}>
          {children}
          <FloatingActions />
          <Analytics />
          <SpeedInsights />
        </SettingsProvider>
      </body>
    </html>
  );
}
