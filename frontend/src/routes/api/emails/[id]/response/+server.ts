import { json } from '@sveltejs/kit';
import { DatabaseService } from '$lib/database/service.js';
import type { RequestHandler } from './$types.js';

export const PATCH: RequestHandler = async ({ params, request }) => {
    try {
        const emailId = parseInt(params.id, 10);
        if (isNaN(emailId)) {
            return json(
                {
                    success: false,
                    error: 'Invalid email ID'
                },
                { status: 400 }
            );
        }

        const { responseStatus } = await request.json();

        // Validate response status
        const validResponseStatuses = ['no_response', 'good_response', 'bad_response'];
        if (!responseStatus || !validResponseStatuses.includes(responseStatus)) {
            return json(
                {
                    success: false,
                    error: 'Invalid response status. Must be one of: no_response, good_response, bad_response'
                },
                { status: 400 }
            );
        }

        const db = DatabaseService.getInstance();

        // Check if email exists
        const existingEmail = await db.getEmailById(emailId);
        if (!existingEmail) {
            return json(
                {
                    success: false,
                    error: 'Email not found'
                },
                { status: 404 }
            );
        }

        // Update response status
        await db.updateResponseStatus(emailId, responseStatus);

        // Record analytics event for responses
        if (responseStatus === 'good_response' || responseStatus === 'bad_response') {
            await db.recordEmailEvent(emailId, 'replied', {
                responseType: responseStatus
            });
        }

        // Get updated email
        const updatedEmail = await db.getEmailById(emailId);

        return json({
            success: true,
            email: updatedEmail,
            message: `Email response status updated to ${responseStatus}`
        });
    } catch (error) {
        console.error('Error updating email response status:', error);
        return json(
            {
                success: false,
                error: 'Failed to update email response status'
            },
            { status: 500 }
        );
    }
};