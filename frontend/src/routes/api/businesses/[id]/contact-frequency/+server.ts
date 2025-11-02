import { json } from '@sveltejs/kit';
import { DatabaseService } from '$lib/database/service.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params }) => {
    try {
        const businessId = parseInt(params.id, 10);
        if (isNaN(businessId)) {
            return json(
                {
                    success: false,
                    error: 'Invalid business ID'
                },
                { status: 400 }
            );
        }

        const db = DatabaseService.getInstance();

        // Get business details
        const business = await db.findBusinessById(businessId);
        if (!business) {
            return json(
                {
                    success: false,
                    error: 'Business not found'
                },
                { status: 404 }
            );
        }

        // Get all emails for this business
        const emails = await db.getBusinessHistory(businessId);

        // Calculate contact frequency statistics
        const totalEmails = emails.length;
        const sentEmails = emails.filter(email => email.sendStatus === 'sent').length;
        const draftEmails = emails.filter(email => email.sendStatus === 'draft').length;
        const failedEmails = emails.filter(email => email.sendStatus === 'failed').length;

        const responseStats = {
            noResponse: emails.filter(email => email.responseStatus === 'no_response').length,
            goodResponse: emails.filter(email => email.responseStatus === 'good_response').length,
            badResponse: emails.filter(email => email.responseStatus === 'bad_response').length
        };

        // Get first and last contact dates
        const sentEmailsWithDates = emails.filter(email => email.sentAt);
        const firstContact = sentEmailsWithDates.length > 0
            ? new Date(Math.min(...sentEmailsWithDates.map(email => new Date(email.sentAt!).getTime())))
            : null;
        const lastContact = sentEmailsWithDates.length > 0
            ? new Date(Math.max(...sentEmailsWithDates.map(email => new Date(email.sentAt!).getTime())))
            : null;

        return json({
            success: true,
            business,
            contactFrequency: {
                totalEmails,
                sentEmails,
                draftEmails,
                failedEmails,
                responseStats,
                firstContact,
                lastContact,
                emails: emails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            }
        });
    } catch (error) {
        console.error('Error fetching contact frequency:', error);
        return json(
            {
                success: false,
                error: 'Failed to fetch contact frequency'
            },
            { status: 500 }
        );
    }
};