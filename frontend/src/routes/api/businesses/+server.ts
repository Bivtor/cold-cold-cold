import { json } from '@sveltejs/kit';
import { DatabaseService } from '$lib/database/service.js';
import type { RequestHandler } from './$types.js';

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