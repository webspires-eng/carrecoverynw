import { NextResponse } from 'next/server';
import { submitUrlToGoogle, submitUrlsToGoogle } from '@/lib/googleIndexing';

/**
 * POST /api/indexing
 * Manual trigger to submit URLs to Google Indexing API.
 *
 * Body:
 *   { url: string, type?: 'URL_UPDATED' | 'URL_DELETED' }
 *   OR
 *   { urls: string[], type?: 'URL_UPDATED' | 'URL_DELETED' }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const type = body.type || 'URL_UPDATED';

        // Batch mode
        if (body.urls && Array.isArray(body.urls)) {
            if (body.urls.length === 0) {
                return NextResponse.json({ success: false, error: 'URLs array is empty' }, { status: 400 });
            }
            if (body.urls.length > 200) {
                return NextResponse.json({ success: false, error: 'Max 200 URLs per batch' }, { status: 400 });
            }

            const result = await submitUrlsToGoogle(body.urls, type);
            const successCount = result.results.filter(r => r.success).length;
            const failCount = result.results.filter(r => !r.success).length;

            return NextResponse.json({
                success: true,
                message: `Batch complete: ${successCount} succeeded, ${failCount} failed`,
                ...result,
            });
        }

        // Single URL mode
        if (!body.url) {
            return NextResponse.json({ success: false, error: 'url or urls is required' }, { status: 400 });
        }

        const result = await submitUrlToGoogle(body.url, type);
        return NextResponse.json(result, { status: result.success ? 200 : 502 });

    } catch (error) {
        console.error('[Indexing API] Error:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
