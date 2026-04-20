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
  const baseUrl = process.env.SITE_URL || 'https://www.cartowingnearme.co.uk';

  return {
    metadataBase: new URL(baseUrl),
    title: "24 Hours Car Recovery Service In United Kingdom | 0736 054 4819",
    description: "Looking for a reliable car recovery and towing service in the UK? We offer 24/7 fast breakdown assistance and emergency towing near you. Call us now!",
    alternates: {
      canonical: "https://www.cartowingnearme.co.uk",
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
  const baseUrl = process.env.SITE_URL || 'https://www.cartowingnearme.co.uk';

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
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.smartlook||(function(d) {
              var o=smartlook=function(){ o.api.push(arguments)},h=d.getElementsByTagName('head')[0];
              var c=d.createElement('script');o.api=new Array();c.async=true;c.type='text/javascript';
              c.charset='utf-8';c.src='https://web-sdk.smartlook.com/recorder.js';h.appendChild(c);
              })(document);
              smartlook('init', 'cac1e5ababc522cc96b9954552c1a72cb45df01f', { region: 'eu' });
            `
          }}
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
