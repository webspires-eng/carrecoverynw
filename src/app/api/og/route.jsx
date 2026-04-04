import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hasCity = searchParams.has('city');
    const city = hasCity ? searchParams.get('city')?.slice(0, 50) : 'United Kingdom';
    const hasTitle = searchParams.has('title');
    const title = hasTitle ? searchParams.get('title')?.slice(0, 80) : `24/7 Car Recovery in ${city}`;

    const bgUrl = process.env.SITE_URL ? `${process.env.SITE_URL}/tow-truck-hero.png` : 'https://www.cartowingnearme.co.uk/tow-truck-hero.png';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#012169',
            position: 'relative',
          }}
        >
          {/* Background Image / Overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${bgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.3,
            }}
          />
          
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '40px 60px',
              borderRadius: '20px',
              border: '4px solid #ed4705',
              boxShadow: '0 15px 30px rgba(0,0,0,0.3)',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontSize: 42,
                fontWeight: 800,
                color: '#ed4705',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '10px'
              }}
            >
              Car Recovery UK
            </span>
            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: '#012169',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1.1,
                marginBottom: '20px',
                maxWidth: '800px',
              }}
            >
              {title}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 32, fontWeight: 700, color: '#444' }}>
              <span style={{ color: '#ed4705', marginRight: '10px' }}>⚡</span> Fast Emergency Response
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error('OG Image generation failed:', e);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
