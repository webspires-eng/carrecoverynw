import { NextResponse } from 'next/server';

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

        const response = await fetch('https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ registrationNumber: registrationNumber.replace(/\s+/g, '').toUpperCase() })
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

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('DVLA API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
