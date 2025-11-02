import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { webScraperService } from '$lib/services/WebScraperService.js';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { url, maxRetries = 2 } = await request.json();

        if (!url) {
            return json({ error: 'URL is required' }, { status: 400 });
        }

        const result = await webScraperService.scrapeWebsite(url, maxRetries);

        return json(result);
    } catch (error) {
        console.error('Scraping API error:', error);
        return json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};