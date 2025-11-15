// Database entity types

export interface Business {
    id: number;
    name: string;
    websiteUrl?: string;
    contactEmail?: string;
    description?: string;
    scrapedData?: ScrapedData;
    createdAt: Date;
    updatedAt: Date;
}

export interface Email {
    id: number;
    businessId: number;
    subject: string;
    htmlContent: string;
    personalNotes?: string;
    sendStatus: 'draft' | 'sent' | 'failed';
    responseStatus: 'unsent' | 'no_response' | 'good_response' | 'bad_response';
    sentAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Note {
    id: number;
    title: string;
    content: string;
    category?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface EmailAnalytics {
    id: number;
    emailId: number;
    eventType: 'sent' | 'opened' | 'clicked' | 'replied';
    eventData?: Record<string, any>;
    timestamp: Date;
}

export interface ScrapedData {
    businessName: string;
    description: string;
    services: string[];
    contactInfo: {
        email?: string;
        phone?: string;
        address?: string;
    };
    socialMedia: {
        linkedin?: string;
        twitter?: string;
        facebook?: string;
    };
    keyContent: string[];
}

// Input types for creating/updating entities

export interface BusinessData {
    name: string;
    websiteUrl?: string;
    contactEmail?: string;
    description?: string;
    scrapedData?: ScrapedData;
}

export interface EmailDraft {
    businessId: number;
    subject: string;
    htmlContent: string;
    personalNotes?: string;
}

export interface NoteData {
    title: string;
    content: string;
    category?: string;
}

// Filter and search types

export interface EmailFilters {
    businessName?: string;
    sendStatus?: 'draft' | 'sent' | 'failed';
    responseStatus?: 'unsent' | 'no_response' | 'good_response' | 'bad_response';
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
}

export interface BusinessFilters {
    name?: string;
    hasEmail?: boolean;
    limit?: number;
    offset?: number;
}

export interface NoteFilters {
    title?: string;
    category?: string;
    content?: string;
    limit?: number;
    offset?: number;
}

// Database row types (as returned from SQLite)

export interface BusinessRow {
    id: number;
    name: string;
    website_url: string | null;
    contact_email: string | null;
    description: string | null;
    scraped_data: string | null; // JSON string
    created_at: string;
    updated_at: string;
}

export interface EmailRow {
    id: number;
    business_id: number;
    subject: string;
    html_content: string;
    personal_notes: string | null;
    send_status: string;
    response_status: string;
    sent_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface NoteRow {
    id: number;
    title: string;
    content: string;
    category: string | null;
    created_at: string;
    updated_at: string;
}

export interface EmailAnalyticsRow {
    id: number;
    email_id: number;
    event_type: string;
    event_data: string | null; // JSON string
    timestamp: string;
}