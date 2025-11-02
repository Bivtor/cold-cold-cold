import { json } from '@sveltejs/kit';
import { DatabaseService } from '$lib/database/service.js';
import type { NoteData, NoteFilters } from '$lib/types/database.js';

const db = DatabaseService.getInstance();

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    try {
        const searchParams = url.searchParams;

        const filters: NoteFilters = {};

        if (searchParams.get('title')) {
            filters.title = searchParams.get('title')!;
        }

        if (searchParams.get('category')) {
            filters.category = searchParams.get('category')!;
        }

        if (searchParams.get('content')) {
            filters.content = searchParams.get('content')!;
        }

        if (searchParams.get('limit')) {
            filters.limit = parseInt(searchParams.get('limit')!);
        }

        if (searchParams.get('offset')) {
            filters.offset = parseInt(searchParams.get('offset')!);
        }

        const notes = await db.getAllNotes(filters);

        return json({
            success: true,
            data: notes
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        return json(
            {
                success: false,
                error: 'Failed to fetch notes'
            },
            { status: 500 }
        );
    }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    try {
        const noteData: NoteData = await request.json();

        // Validate required fields
        if (!noteData.title || !noteData.content) {
            return json(
                {
                    success: false,
                    error: 'Title and content are required'
                },
                { status: 400 }
            );
        }

        const noteId = await db.saveNote(noteData);
        const createdNote = await db.getNoteById(noteId);

        return json({
            success: true,
            data: createdNote
        });
    } catch (error) {
        console.error('Error creating note:', error);
        return json(
            {
                success: false,
                error: 'Failed to create note'
            },
            { status: 500 }
        );
    }
}