import { json } from '@sveltejs/kit';
import { DatabaseService } from '$lib/database/service.js';
import { zohoEmailService } from '$lib/services/index.js';
import type { EmailFilters, EmailDraft } from '$lib/types/database.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url }) => {
    try {
        const db = DatabaseService.getInstance();

        // Parse query parameters for filtering
        const filters: EmailFilters = {};

        const businessName = url.searchParams.get('businessName');
        if (businessName) {
            filters.businessName = businessName;
        }

        const sendStatus = url.searchParams.get('sendStatus');
        if (sendStatus && ['draft', 'sent', 'failed'].includes(sendStatus)) {
            filters.sendStatus = sendStatus as 'draft' | 'sent' | 'failed';
        }

        const responseStatus = url.searchParams.get('responseStatus');
        if (responseStatus && ['no_response', 'good_response', 'bad_response'].includes(responseStatus)) {
            filters.responseStatus = responseStatus as 'no_response' | 'good_response' | 'bad_response';
        }

        const dateFrom = url.searchParams.get('dateFrom');
        if (dateFrom) {
            filters.dateFrom = new Date(dateFrom);
        }

        const dateTo = url.searchParams.get('dateTo');
        if (dateTo) {
            filters.dateTo = new Date(dateTo);
        }

        const limit = url.searchParams.get('limit');
        if (limit) {
            filters.limit = parseInt(limit, 10);
        }

        const offset = url.searchParams.get('offset');
        if (offset) {
            filters.offset = parseInt(offset, 10);
        }

        const emails = await db.searchEmails(filters);

        // Get business names for each email
        const emailsWithBusinessNames = await Promise.all(
            emails.map(async (email) => {
                const business = await db.findBusinessById(email.businessId);
                return {
                    ...email,
                    businessName: business?.name || 'Unknown Business'
                };
            })
        );

        return json({
            success: true,
            emails: emailsWithBusinessNames
        });
    } catch (error) {
        console.error('Error fetching emails:', error);
        return json(
            {
                success: false,
                error: 'Failed to fetch emails'
            },
            { status: 500 }
        );
    }
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        const emailData: EmailDraft & {
            recipientEmail: string;
            fromName?: string;
            fromEmail?: string;
        } = await request.json();

        // Validate required fields
        if (!emailData.businessId || !emailData.subject || !emailData.htmlContent || !emailData.recipientEmail) {
            return json(
                {
                    success: false,
                    error: 'businessId, subject, htmlContent, and recipientEmail are required'
                },
                { status: 400 }
            );
        }

        const db = DatabaseService.getInstance();

        // Save draft first
        const emailId = await db.saveDraft({
            businessId: emailData.businessId,
            subject: emailData.subject,
            htmlContent: emailData.htmlContent,
            personalNotes: emailData.personalNotes
        });

        try {
            // Send email via Zoho
            const sendResult = await zohoEmailService.sendEmail({
                to: emailData.recipientEmail,
                subject: emailData.subject,
                htmlContent: emailData.htmlContent,
                fromName: emailData.fromName || 'Cold Email System',
                fromEmail: emailData.fromEmail || process.env.ZOHO_FROM_EMAIL || ''
            });

            if (sendResult.success) {
                // Update status to sent
                await db.updateEmailStatus(emailId, 'sent', new Date());

                // Record analytics event
                await db.recordEmailEvent(emailId, 'sent', {
                    recipient: emailData.recipientEmail,
                    zohoMessageId: sendResult.data?.messageId
                });

                return json({
                    success: true,
                    emailId,
                    message: 'Email sent successfully'
                });
            } else {
                // Update status to failed
                await db.updateEmailStatus(emailId, 'failed');

                return json(
                    {
                        success: false,
                        error: sendResult.error || 'Failed to send email',
                        emailId
                    },
                    { status: 500 }
                );
            }
        } catch (sendError) {
            // Update status to failed
            await db.updateEmailStatus(emailId, 'failed');

            console.error('Email sending error:', sendError);
            return json(
                {
                    success: false,
                    error: 'Failed to send email via Zoho service',
                    emailId
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error in email API:', error);
        return json(
            {
                success: false,
                error: 'Internal server error'
            },
            { status: 500 }
        );
    }
};