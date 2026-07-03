// Client-side singleton loader for the Google Maps JS API (places library).
// Injects the script tag once; every subsequent call reuses the same promise.

let loaderPromise = null;

export function loadGoogleMaps() {
    if (typeof window === 'undefined') return Promise.resolve(null);
    if (window.google?.maps?.places) return Promise.resolve(window.google);
    if (loaderPromise) return loaderPromise;

    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
        console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set — map features disabled.');
        return Promise.resolve(null);
    }

    loaderPromise = new Promise((resolve, reject) => {
        // Another component (or a previous page) may already have injected it.
        const existing = document.querySelector('script[data-google-maps-loader]');
        if (existing) {
            existing.addEventListener('load', () => resolve(window.google));
            existing.addEventListener('error', () => reject(new Error('Google Maps failed to load')));
            return;
        }

        // loading=async requires a callback to know when the API is usable.
        const callbackName = '__googleMapsLoaderCallback';
        window[callbackName] = () => {
            delete window[callbackName];
            resolve(window.google);
        };

        const script = document.createElement('script');
        script.src =
            'https://maps.googleapis.com/maps/api/js' +
            `?key=${encodeURIComponent(key)}&libraries=places&loading=async&callback=${callbackName}`;
        script.async = true;
        script.dataset.googleMapsLoader = 'true';
        script.onerror = () => {
            loaderPromise = null;
            delete window[callbackName];
            reject(new Error('Google Maps failed to load'));
        };
        document.head.appendChild(script);
    });

    return loaderPromise;
}
