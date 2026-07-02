"use client";

import { useEffect } from "react";

// Loads the Smartlook recorder only after the first real user interaction
// (or a 10s idle fallback for genuinely passive humans). Crawlers never
// interact, so Googlebot no longer downloads recorder.js on every page —
// real-visitor recording behaviour is unchanged apart from missing the first
// second or two of the session.
const SMARTLOOK_KEY = "aed7ca16f366541caca55245c4f60e6dd364a9aa";

export default function DeferredAnalytics() {
    useEffect(() => {
        let loaded = false;
        const load = () => {
            if (loaded) return;
            loaded = true;
            cleanup();
            window.smartlook || (function (d) {
                var o = (window.smartlook = function () { o.api.push(arguments); }),
                    h = d.getElementsByTagName("head")[0];
                var c = d.createElement("script");
                o.api = [];
                c.async = true;
                c.type = "text/javascript";
                c.charset = "utf-8";
                c.src = "https://web-sdk.smartlook.com/recorder.js";
                h.appendChild(c);
            })(document);
            window.smartlook("init", SMARTLOOK_KEY, { region: "eu" });
        };

        const events = ["pointerdown", "keydown", "touchstart", "scroll"];
        const cleanup = () => events.forEach((e) => window.removeEventListener(e, load));
        events.forEach((e) => window.addEventListener(e, load, { once: true, passive: true }));
        const idleTimer = setTimeout(load, 10000);

        return () => { cleanup(); clearTimeout(idleTimer); };
    }, []);

    return null;
}
