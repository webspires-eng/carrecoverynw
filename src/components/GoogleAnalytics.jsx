import Script from "next/script";

// GA4 property: cartowingnearme.co.uk (Car Towing Near Me account).
// Unlike the Smartlook recorder in DeferredAnalytics, gtag must run on every
// visit — gating it behind an interaction would drop the pageview for anyone
// who bounces without clicking or scrolling.
const GA_MEASUREMENT_ID = "G-DBJR98C30K";

export default function GoogleAnalytics() {
    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_MEASUREMENT_ID}');
                `}
            </Script>
        </>
    );
}
