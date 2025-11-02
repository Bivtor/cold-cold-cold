import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { claudeService } from '$lib/services/index.js';
import type { EmailGenerationRequest } from '$lib/types/index.js';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const requestData: EmailGenerationRequest = await request.json();

        // Validate required fields
        if (!requestData.personalNotes && !requestData.manualContent && !requestData.scrapedData) {
            return json(
                { error: 'At least one of personalNotes, manualContent, or scrapedData is required' },
                { status: 400 }
            );
        }

        const result = await claudeService.generateEmail(requestData);

        return json(result);
    } catch (error) {
        console.error('Email generation API error:', error);
        return json(
            {
                success: false,
                error: {
                    message: 'Internal server error during email generation',
                    code: 'AI_API_ERROR',
                    retryable: true
                }
            },
            { status: 500 }
        );
    }
};