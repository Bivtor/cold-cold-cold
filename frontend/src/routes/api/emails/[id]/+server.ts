import { json } from '@sveltejs/kit';
import { DatabaseService } from '$lib/database/service.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params }) => {
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

        const db = DatabaseService.getInstance();
        const email = await db.getEmailById(emailId);

        if (!email) {
            return json(
                {
                    success: false,
                    error: 'Email not found'
                },
                { status: 404 }
            );
        }

        // Get business information
        const business = await db.findBusinessById(email.businessId);

        return json({
            success: true,
            email: {
                ...email,
                businessName: business?.name || 'Unknown Business',
                businessEmail: business?.contactEmail
            }
        });
    } catch (error) {
        console.error('Error fetching email:', error);
        return json(
            {
                success: false,
                error: 'Failed to fetch email'
            },
            { status: 500 }
        );
    }
};

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

        const updateData = await request.json();

        // Update HTML content if provided
        if (updateData.htmlContent !== undefined) {
            await db.updateEmailContent(emailId, updateData.htmlContent);
        }

        // Validate and update send status
        if (updateData.sendStatus !== undefined) {
            const validSendStatuses = ['draft', 'sent', 'failed'];
            if (!validSendStatuses.includes(updateData.sendStatus)) {
                return json(
                    {
                        success: false,
                        error: 'Invalid send status. Must be one of: draft, sent, failed'
                    },
                    { status: 400 }
                );
            }

            const sentAt = updateData.sendStatus === 'sent' ? new Date() : undefined;
            await db.updateEmailStatus(emailId, updateData.sendStatus, sentAt);
        }

        // Validate and update response status
        if (updateData.responseStatus !== undefined) {
            const validResponseStatuses = ['unsent', 'no_response', 'good_response', 'bad_response'];
            if (!validResponseStatuses.includes(updateData.responseStatus)) {
                return json(
                    {
                        success: false,
                        error: 'Invalid response status. Must be one of: unsent, no_response, good_response, bad_response'
                    },
                    { status: 400 }
                );
            }

            await db.updateResponseStatus(emailId, updateData.responseStatus);
        }

        // Get updated email
        const updatedEmail = await db.getEmailById(emailId);
        const business = await db.findBusinessById(updatedEmail!.businessId);

        return json({
            success: true,
            email: {
                ...updatedEmail,
                businessName: business?.name || 'Unknown Business',
                businessEmail: business?.contactEmail
            }
        });
    } catch (error) {
        console.error('Error updating email status:', error);
        return json(
            {
                success: false,
                error: 'Failed to update email status'
            },
            { status: 500 }
        );
    }
};

export const DELETE: RequestHandler = async ({ params }) => {
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

        // Delete the email
        await db.deleteEmail(emailId);

        return json({
            success: true,
            message: 'Email deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting email:', error);
        return json(
            {
                success: false,
                error: 'Failed to delete email'
            },
            { status: 500 }
        );
    }
};