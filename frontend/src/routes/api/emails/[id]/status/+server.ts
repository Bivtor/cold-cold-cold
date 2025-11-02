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

        const { status } = await request.json();

        // Validate status
        const validStatuses = ['draft', 'sent', 'failed'];
        if (!status || !validStatuses.includes(status)) {
            return json(
                {
                    success: false,
                    error: 'Invalid status. Must be one of: draft, sent, failed'
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

        // Update send status
        const sentAt = status === 'sent' ? new Date() : undefined;
        await db.updateEmailStatus(emailId, status, sentAt);

        // Record analytics event if status is sent
        if (status === 'sent') {
            await db.recordEmailEvent(emailId, 'sent');
        }

        // Get updated email
        const updatedEmail = await db.getEmailById(emailId);

        return json({
            success: true,
            email: updatedEmail,
            message: `Email status updated to ${status}`
        });
    } catch (error) {
        console.error('Error updating email send status:', error);
        return json(
            {
                success: false,
                error: 'Failed to update email send status'
            },
            { status: 500 }
        );
    }
};