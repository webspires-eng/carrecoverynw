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

export const metadata = {
  title: "24 Hours Car Recovery Service In West Midlands & Outskirts | 0736 054 4819",
  description: "24/7 Emergency Car Recovery Service covering the entire UK. Arrive in less than 15 minutes. Call 0736 054 4819 for immediate assistance.",
  keywords: "car recovery, emergency towing, 24/7 recovery, UK car recovery, roadside assistance, vehicle transport",
  icons: {
    icon: "/truckicon.png",
  },
};

export default async function RootLayout({ children }) {
  const settings = await getSettings();

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/truckicon.png" type="image/png" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
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
