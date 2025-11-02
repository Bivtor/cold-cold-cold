import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { webScraperService } from '$lib/services/index.js';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { url } = await request.json();

        if (!url || typeof url !== 'string') {
            return json(
                { error: 'URL is required and must be a string' },
                { status: 400 }
            );
        }

        const result = await webScraperService.scrapeWebsite(url);

        return json(result);
    } catch (error) {
        console.error('Scraping API error:', error);
        return json(
            {
                success: false,
                error: {
                    message: 'Internal server error during scraping',
                    code: 'SCRAPING_ERROR',
                    retryable: true
                }
            },
            { status: 500 }
        );
    }
};