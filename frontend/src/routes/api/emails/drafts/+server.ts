import { json } from '@sveltejs/kit';
import { DatabaseService } from '$lib/database/service.js';
import type { EmailDraft } from '$lib/types/database.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const draftData: EmailDraft = await request.json();

        // Validate required fields
        if (!draftData.businessId || !draftData.subject || !draftData.htmlContent) {
            return json(
                {
                    success: false,
                    error: 'businessId, subject, and htmlContent are required'
                },
                { status: 400 }
            );
        }

        const db = DatabaseService.getInstance();

        // Save draft
        const emailId = await db.saveDraft(draftData);

        return json({
            success: true,
            emailId,
            message: 'Draft saved successfully'
        });
    } catch (error) {
        console.error('Error saving draft:', error);
        return json(
            {
                success: false,
                error: 'Failed to save draft'
            },
            { status: 500 }
        );
    }
};

export const GET: RequestHandler = async () => {
    try {
        const db = DatabaseService.getInstance();

        // Get all drafts
        const drafts = await db.searchEmails({ sendStatus: 'draft' });

        // Get business names for each draft
        const draftsWithBusinessNames = await Promise.all(
            drafts.map(async (draft) => {
                const business = await db.findBusinessById(draft.businessId);
                return {
                    ...draft,
                    businessName: business?.name || 'Unknown Business'
                };
            })
        );

        return json({
            success: true,
            drafts: draftsWithBusinessNames
        });
    } catch (error) {
        console.error('Error fetching drafts:', error);
        return json(
            {
                success: false,
                error: 'Failed to fetch drafts'
            },
            { status: 500 }
        );
    }
};
