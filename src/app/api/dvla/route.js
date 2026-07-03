import { NextResponse } from 'next/server';

// DVLA VES returns make/colour/year/fuel but NO model name.
// The DVSA MOT History API does return the model, so when its credentials
// are configured we use it to enrich the DVLA result.
// Register (free) at https://documentation.history.mot.api.gov.uk/ then set:
// MOT_TOKEN_URL, MOT_CLIENT_ID, MOT_CLIENT_SECRET, MOT_API_KEY
async function fetchMotModel(registrationNumber) {
    const { MOT_TOKEN_URL, MOT_CLIENT_ID, MOT_CLIENT_SECRET, MOT_API_KEY } = process.env;
    if (!MOT_TOKEN_URL || !MOT_CLIENT_ID || !MOT_CLIENT_SECRET || !MOT_API_KEY) return null;

    try {
        const tokenRes = await fetch(MOT_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: MOT_CLIENT_ID,
                client_secret: MOT_CLIENT_SECRET,
                scope: 'https://tapi.dvsa.gov.uk/.default',
            }),
        });
        if (!tokenRes.ok) return null;
        const { access_token } = await tokenRes.json();
        if (!access_token) return null;

        const res = await fetch(
            `https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${encodeURIComponent(registrationNumber)}`,
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'X-API-Key': MOT_API_KEY,
                },
            }
        );
        if (!res.ok) return null;
        const vehicle = await res.json();
        return vehicle?.model || null;
    } catch (error) {
        console.error('MOT History API Error:', error);
        return null;
    }
}

export async function POST(req) {
    try {
        const { registrationNumber } = await req.json();

        if (!registrationNumber) {
            return NextResponse.json({ success: false, message: 'Registration number is required' }, { status: 400 });
        }

        const apiKey = process.env.DVLA_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ success: false, message: 'API key not configured' }, { status: 500 });
        }

        const cleanReg = registrationNumber.replace(/\s+/g, '').toUpperCase();

        const response = await fetch('https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ registrationNumber: cleanReg })
        });

        if (!response.ok) {
             const errorData = await response.json().catch(() => ({}));
             return NextResponse.json({
                 success: false,
                 message: 'Vehicle not found or API error',
                 error: errorData
             }, { status: 404 });
        }

        const data = await response.json();

        // DVLA never returns the model — try the MOT History API for it
        if (!data.model) {
            const model = await fetchMotModel(cleanReg);
            if (model) data.model = model;
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('DVLA API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
