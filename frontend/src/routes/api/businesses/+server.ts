import { json } from '@sveltejs/kit';
import { DatabaseService } from '$lib/database/service.js';
import type { RequestHandler } from './$types.js';
import type { BusinessData } from '$lib/types/database.js';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const businessData: BusinessData = await request.json();

        // Validate required fields
        if (!businessData.name) {
            return json(
                {
                    success: false,
                    error: 'Business name is required'
                },
                { status: 400 }
            );
        }

        const db = DatabaseService.getInstance();

        // Check if business already exists by email
        if (businessData.contactEmail) {
            const existingBusiness = await db.findBusinessByEmail(businessData.contactEmail);
            if (existingBusiness) {
                return json({
                    success: true,
                    businessId: existingBusiness.id,
                    message: 'Business already exists',
                    existing: true
                });
            }
        }

        // Create new business
        const businessId = await db.createBusiness(businessData);

        return json({
            success: true,
            businessId,
            message: 'Business created successfully'
        });
    } catch (error) {
        console.error('Error creating business:', error);
        return json(
            {
                success: false,
                error: 'Failed to create business'
            },
            { status: 500 }
        );
    }
};

export const GET: RequestHandler = async ({ url }) => {
    try {
        const db = DatabaseService.getInstance();

        // Parse query parameters for search
        const searchTerm = url.searchParams.get('search');
        const limit = url.searchParams.get('limit');
        const offset = url.searchParams.get('offset');

        const filters = {
            ...(searchTerm && { name: searchTerm }),
            ...(limit && { limit: parseInt(limit, 10) }),
            ...(offset && { offset: parseInt(offset, 10) })
        };

        const businesses = await db.searchBusinesses(filters);

        return json({
            success: true,
            businesses
        });
    } catch (error) {
        console.error('Error searching businesses:', error);
        return json(
            {
                success: false,
                error: 'Failed to search businesses'
            },
            { status: 500 }
        );
    }
};