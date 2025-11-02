import { json } from '@sveltejs/kit';
import { DatabaseService } from '$lib/database/service.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url }) => {
    try {
        const db = DatabaseService.getInstance();

        // Parse date range filters
        const dateFrom = url.searchParams.get('dateFrom');
        const dateTo = url.searchParams.get('dateTo');

        const filters: any = {};
        if (dateFrom) filters.dateFrom = new Date(dateFrom);
        if (dateTo) filters.dateTo = new Date(dateTo);

        // Get all emails within date range
        const emails = await db.searchEmails(filters);

        // Calculate overall statistics
        const totalEmails = emails.length;
        const sentEmails = emails.filter(email => email.sendStatus === 'sent').length;
        const draftEmails = emails.filter(email => email.sendStatus === 'draft').length;
        const failedEmails = emails.filter(email => email.sendStatus === 'failed').length;

        const responseStats = {
            noResponse: emails.filter(email => email.responseStatus === 'no_response').length,
            goodResponse: emails.filter(email => email.responseStatus === 'good_response').length,
            badResponse: emails.filter(email => email.responseStatus === 'bad_response').length
        };

        // Calculate response rate (only for sent emails)
        const responseRate = sentEmails > 0
            ? ((responseStats.goodResponse + responseStats.badResponse) / sentEmails * 100).toFixed(1)
            : '0.0';

        const goodResponseRate = sentEmails > 0
            ? (responseStats.goodResponse / sentEmails * 100).toFixed(1)
            : '0.0';

        // Get unique businesses contacted
        const uniqueBusinesses = new Set(emails.map(email => email.businessId)).size;

        // Get emails by date for timeline
        const emailsByDate = emails.reduce((acc, email) => {
            const date = new Date(email.createdAt).toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { total: 0, sent: 0, responses: 0 };
            }
            acc[date].total++;
            if (email.sendStatus === 'sent') {
                acc[date].sent++;
            }
            if (email.responseStatus === 'good_response' || email.responseStatus === 'bad_response') {
                acc[date].responses++;
            }
            return acc;
        }, {} as Record<string, { total: number; sent: number; responses: number }>);

        // Convert to array and sort by date
        const timeline = Object.entries(emailsByDate)
            .map(([date, stats]) => ({ date, ...stats }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Get top businesses by email count
        const businessEmailCounts = emails.reduce((acc, email) => {
            const businessId = email.businessId;
            if (!acc[businessId]) {
                acc[businessId] = { count: 0, businessId, sent: 0, responses: 0 };
            }
            acc[businessId].count++;
            if (email.sendStatus === 'sent') {
                acc[businessId].sent++;
            }
            if (email.responseStatus === 'good_response' || email.responseStatus === 'bad_response') {
                acc[businessId].responses++;
            }
            return acc;
        }, {} as Record<number, { count: number; businessId: number; sent: number; responses: number }>);

        // Get business names for top businesses
        const topBusinesses = await Promise.all(
            Object.values(businessEmailCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)
                .map(async (item) => {
                    const business = await db.findBusinessById(item.businessId);
                    return {
                        ...item,
                        businessName: business?.name || 'Unknown Business'
                    };
                })
        );

        return json({
            success: true,
            analytics: {
                overview: {
                    totalEmails,
                    sentEmails,
                    draftEmails,
                    failedEmails,
                    uniqueBusinesses,
                    responseRate: parseFloat(responseRate),
                    goodResponseRate: parseFloat(goodResponseRate)
                },
                responseStats,
                timeline,
                topBusinesses
            }
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return json(
            {
                success: false,
                error: 'Failed to fetch analytics'
            },
            { status: 500 }
        );
    }
};