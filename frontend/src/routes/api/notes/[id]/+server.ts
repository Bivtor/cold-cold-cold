import { json } from '@sveltejs/kit';
import { DatabaseService } from '$lib/database/service.js';

const db = DatabaseService.getInstance();

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
    try {
        const noteId = parseInt(params.id);

        if (isNaN(noteId)) {
            return json(
                {
                    success: false,
                    error: 'Invalid note ID'
                },
                { status: 400 }
            );
        }

        const note = await db.getNoteById(noteId);

        if (!note) {
            return json(
                {
                    success: false,
                    error: 'Note not found'
                },
                { status: 404 }
            );
        }

        return json({
            success: true,
            data: note
        });
    } catch (error) {
        console.error('Error fetching note:', error);
        return json(
            {
                success: false,
                error: 'Failed to fetch note'
            },
            { status: 500 }
        );
    }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request }) {
    try {
        const noteId = parseInt(params.id);

        if (isNaN(noteId)) {
            return json(
                {
                    success: false,
                    error: 'Invalid note ID'
                },
                { status: 400 }
            );
        }

        const { title, content } = await request.json();

        if (!content) {
            return json(
                {
                    success: false,
                    error: 'Content is required'
                },
                { status: 400 }
            );
        }

        // Check if note exists
        const existingNote = await db.getNoteById(noteId);
        if (!existingNote) {
            return json(
                {
                    success: false,
                    error: 'Note not found'
                },
                { status: 404 }
            );
        }

        await db.updateNote(noteId, content, title);
        const updatedNote = await db.getNoteById(noteId);

        return json({
            success: true,
            data: updatedNote
        });
    } catch (error) {
        console.error('Error updating note:', error);
        return json(
            {
                success: false,
                error: 'Failed to update note'
            },
            { status: 500 }
        );
    }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
    try {
        const noteId = parseInt(params.id);

        if (isNaN(noteId)) {
            return json(
                {
                    success: false,
                    error: 'Invalid note ID'
                },
                { status: 400 }
            );
        }

        // Check if note exists
        const existingNote = await db.getNoteById(noteId);
        if (!existingNote) {
            return json(
                {
                    success: false,
                    error: 'Note not found'
                },
                { status: 404 }
            );
        }

        await db.deleteNote(noteId);

        return json({
            success: true,
            message: 'Note deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting note:', error);
        return json(
            {
                success: false,
                error: 'Failed to delete note'
            },
            { status: 500 }
        );
    }
}