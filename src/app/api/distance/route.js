import { NextResponse } from 'next/server';

// Driving distance between two places via the Distance Matrix API.
// Called server-side so the request itself doesn't expose usage patterns
// and works even if the browser key gets referrer-restricted later.
export async function POST(req) {
    try {
        const { origin, destination } = await req.json();

        if (!origin || !destination) {
            return NextResponse.json({ success: false, error: 'Origin and destination are required' }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'Google Maps API key not configured' }, { status: 500 });
        }

        const params = new URLSearchParams({
            origins: origin,
            destinations: destination,
            mode: 'driving',
            units: 'imperial',
            region: 'gb',
            key: apiKey,
        });

        const response = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?${params}`);
        const data = await response.json();

        const element = data?.rows?.[0]?.elements?.[0];
        if (data.status !== 'OK' || !element || element.status !== 'OK') {
            const noRoute = element?.status === 'ZERO_RESULTS' || element?.status === 'NOT_FOUND';
            return NextResponse.json({
                success: false,
                error: noRoute
                    ? 'No driving route found between these locations'
                    : 'Could not calculate distance',
            });
        }

        return NextResponse.json({
            success: true,
            distanceText: element.distance.text,          // e.g. "12.4 mi"
            distanceMiles: Math.round((element.distance.value / 1609.344) * 10) / 10,
            durationText: element.duration.text,          // e.g. "24 mins"
        });
    } catch (error) {
        console.error('Distance Matrix API Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
