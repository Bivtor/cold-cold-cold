import Database from 'better-sqlite3';
import { initializeDatabase, getDatabasePath } from './init.js';
import type {
    Business,
    Email,
    Note,
    EmailAnalytics,
    BusinessData,
    EmailDraft,
    NoteData,
    EmailFilters,
    BusinessFilters,
    NoteFilters,
    BusinessRow,
    EmailRow,
    NoteRow,
    EmailAnalyticsRow,
    ScrapedData
} from '../types/database.js';

export class DatabaseService {
    private db: Database.Database;
    private static instance: DatabaseService;

    private constructor() {
        const dbPath = getDatabasePath();
        this.db = initializeDatabase(dbPath);
    }

    /**
     * Get singleton instance of DatabaseService
     */
    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    /**
     * Close database connection
     */
    public close(): void {
        this.db.close();
    }

    // Business operations

    /**
     * Create a new business record
     */
    public async createBusiness(businessData: BusinessData): Promise<number> {
        const stmt = this.db.prepare(`
      INSERT INTO businesses (name, website_url, contact_email, description, scraped_data, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

        const scrapedDataJson = businessData.scrapedData ? JSON.stringify(businessData.scrapedData) : null;

        const result = stmt.run(
            businessData.name,
            businessData.websiteUrl || null,
            businessData.contactEmail || null,
            businessData.description || null,
            scrapedDataJson
        );

        return result.lastInsertRowid as number;
    }

    /**
     * Find business by email address
     */
    public async findBusinessByEmail(email: string): Promise<Business | null> {
        const stmt = this.db.prepare('SELECT * FROM businesses WHERE contact_email = ?');
        const row = stmt.get(email) as BusinessRow | undefined;

        return row ? this.mapBusinessRow(row) : null;
    }

    /**
     * Find business by ID
     */
    public async findBusinessById(id: number): Promise<Business | null> {
        const stmt = this.db.prepare('SELECT * FROM businesses WHERE id = ?');
        const row = stmt.get(id) as BusinessRow | undefined;

        return row ? this.mapBusinessRow(row) : null;
    }

    /**
     * Search businesses with filters
     */
    public async searchBusinesses(filters: BusinessFilters = {}): Promise<Business[]> {
        let query = 'SELECT * FROM businesses WHERE 1=1';
        const params: any[] = [];

        if (filters.name) {
            query += ' AND name LIKE ?';
            params.push(`%${filters.name}%`);
        }

        if (filters.hasEmail !== undefined) {
            if (filters.hasEmail) {
                query += ' AND contact_email IS NOT NULL';
            } else {
                query += ' AND contact_email IS NULL';
            }
        }

        query += ' ORDER BY created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(filters.limit);
        }

        if (filters.offset) {
            query += ' OFFSET ?';
            params.push(filters.offset);
        }

        const stmt = this.db.prepare(query);
        const rows = stmt.all(...params) as BusinessRow[];

        return rows.map(row => this.mapBusinessRow(row));
    }

    /**
     * Get email history for a business
     */
    public async getBusinessHistory(businessId: number): Promise<Email[]> {
        const stmt = this.db.prepare(`
      SELECT * FROM emails 
      WHERE business_id = ? 
      ORDER BY created_at DESC
    `);

        const rows = stmt.all(businessId) as EmailRow[];
        return rows.map(row => this.mapEmailRow(row));
    }

    // Email operations

    /**
     * Save email draft
     */
    public async saveDraft(emailData: EmailDraft): Promise<number> {
        const stmt = this.db.prepare(`
      INSERT INTO emails (business_id, subject, html_content, personal_notes, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

        const result = stmt.run(
            emailData.businessId,
            emailData.subject,
            emailData.htmlContent,
            emailData.personalNotes || null
        );

        return result.lastInsertRowid as number;
    }

    /**
     * Update email send status
     */
    public async updateEmailStatus(
        emailId: number,
        status: 'draft' | 'sent' | 'failed',
        sentAt?: Date
    ): Promise<void> {
        const stmt = this.db.prepare(`
      UPDATE emails 
      SET send_status = ?, sent_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

        stmt.run(status, sentAt?.toISOString() || null, emailId);
    }

    /**
     * Update email response status
     */
    public async updateResponseStatus(
        emailId: number,
        status: 'no_response' | 'good_response' | 'bad_response'
    ): Promise<void> {
        const stmt = this.db.prepare(`
      UPDATE emails 
      SET response_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

        stmt.run(status, emailId);
    }

    /**
     * Search emails with filters
     */
    public async searchEmails(filters: EmailFilters = {}): Promise<Email[]> {
        let query = `
      SELECT e.*, b.name as business_name 
      FROM emails e
      LEFT JOIN businesses b ON e.business_id = b.id
      WHERE 1=1
    `;
        const params: any[] = [];

        if (filters.businessName) {
            query += ' AND b.name LIKE ?';
            params.push(`%${filters.businessName}%`);
        }

        if (filters.sendStatus) {
            query += ' AND e.send_status = ?';
            params.push(filters.sendStatus);
        }

        if (filters.responseStatus) {
            query += ' AND e.response_status = ?';
            params.push(filters.responseStatus);
        }

        if (filters.dateFrom) {
            query += ' AND e.created_at >= ?';
            params.push(filters.dateFrom.toISOString());
        }

        if (filters.dateTo) {
            query += ' AND e.created_at <= ?';
            params.push(filters.dateTo.toISOString());
        }

        query += ' ORDER BY e.created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(filters.limit);
        }

        if (filters.offset) {
            query += ' OFFSET ?';
            params.push(filters.offset);
        }

        const stmt = this.db.prepare(query);
        const rows = stmt.all(...params) as (EmailRow & { business_name: string })[];

        return rows.map(row => this.mapEmailRow(row));
    }

    /**
     * Get email by ID
     */
    public async getEmailById(id: number): Promise<Email | null> {
        const stmt = this.db.prepare('SELECT * FROM emails WHERE id = ?');
        const row = stmt.get(id) as EmailRow | undefined;

        return row ? this.mapEmailRow(row) : null;
    }

    // Notes operations

    /**
     * Save a new note
     */
    public async saveNote(note: NoteData): Promise<number> {
        const stmt = this.db.prepare(`
      INSERT INTO notes (title, content, category, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);

        const result = stmt.run(
            note.title,
            note.content,
            note.category || null
        );

        return result.lastInsertRowid as number;
    }

    /**
     * Get all notes with optional filtering
     */
    public async getAllNotes(filters: NoteFilters = {}): Promise<Note[]> {
        let query = 'SELECT * FROM notes WHERE 1=1';
        const params: any[] = [];

        if (filters.title) {
            query += ' AND title LIKE ?';
            params.push(`%${filters.title}%`);
        }

        if (filters.category) {
            query += ' AND category = ?';
            params.push(filters.category);
        }

        if (filters.content) {
            query += ' AND content LIKE ?';
            params.push(`%${filters.content}%`);
        }

        query += ' ORDER BY created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(filters.limit);
        }

        if (filters.offset) {
            query += ' OFFSET ?';
            params.push(filters.offset);
        }

        const stmt = this.db.prepare(query);
        const rows = stmt.all(...params) as NoteRow[];

        return rows.map(row => this.mapNoteRow(row));
    }

    /**
     * Update an existing note
     */
    public async updateNote(noteId: number, content: string, title?: string): Promise<void> {
        let query = 'UPDATE notes SET updated_at = CURRENT_TIMESTAMP';
        const params: any[] = [];

        if (title !== undefined) {
            query += ', title = ?';
            params.push(title);
        }

        query += ', content = ? WHERE id = ?';
        params.push(content, noteId);

        const stmt = this.db.prepare(query);
        stmt.run(...params);
    }

    /**
     * Delete a note
     */
    public async deleteNote(noteId: number): Promise<void> {
        const stmt = this.db.prepare('DELETE FROM notes WHERE id = ?');
        stmt.run(noteId);
    }

    /**
     * Get note by ID
     */
    public async getNoteById(id: number): Promise<Note | null> {
        const stmt = this.db.prepare('SELECT * FROM notes WHERE id = ?');
        const row = stmt.get(id) as NoteRow | undefined;

        return row ? this.mapNoteRow(row) : null;
    }

    // Email Analytics operations

    /**
     * Record email analytics event
     */
    public async recordEmailEvent(
        emailId: number,
        eventType: 'sent' | 'opened' | 'clicked' | 'replied',
        eventData?: Record<string, any>
    ): Promise<number> {
        const stmt = this.db.prepare(`
      INSERT INTO email_analytics (email_id, event_type, event_data)
      VALUES (?, ?, ?)
    `);

        const eventDataJson = eventData ? JSON.stringify(eventData) : null;

        const result = stmt.run(emailId, eventType, eventDataJson);
        return result.lastInsertRowid as number;
    }

    /**
     * Get analytics for an email
     */
    public async getEmailAnalytics(emailId: number): Promise<EmailAnalytics[]> {
        const stmt = this.db.prepare(`
      SELECT * FROM email_analytics 
      WHERE email_id = ? 
      ORDER BY timestamp DESC
    `);

        const rows = stmt.all(emailId) as EmailAnalyticsRow[];
        return rows.map(row => this.mapEmailAnalyticsRow(row));
    }

    // Private mapping methods

    private mapBusinessRow(row: BusinessRow): Business {
        return {
            id: row.id,
            name: row.name,
            websiteUrl: row.website_url || undefined,
            contactEmail: row.contact_email || undefined,
            description: row.description || undefined,
            scrapedData: row.scraped_data ? JSON.parse(row.scraped_data) as ScrapedData : undefined,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }

    private mapEmailRow(row: EmailRow): Email {
        return {
            id: row.id,
            businessId: row.business_id,
            subject: row.subject,
            htmlContent: row.html_content,
            personalNotes: row.personal_notes || undefined,
            sendStatus: row.send_status as 'draft' | 'sent' | 'failed',
            responseStatus: row.response_status as 'no_response' | 'good_response' | 'bad_response',
            sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }

    private mapNoteRow(row: NoteRow): Note {
        return {
            id: row.id,
            title: row.title,
            content: row.content,
            category: row.category || undefined,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }

    private mapEmailAnalyticsRow(row: EmailAnalyticsRow): EmailAnalytics {
        return {
            id: row.id,
            emailId: row.email_id,
            eventType: row.event_type as 'sent' | 'opened' | 'clicked' | 'replied',
            eventData: row.event_data ? JSON.parse(row.event_data) : undefined,
            timestamp: new Date(row.timestamp)
        };
    }
}