// Core data types for the Cold Email Pipeline

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
    responseStatus: 'no_response' | 'good_response' | 'bad_response';
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

export interface EmailGenerationRequest {
    manualContent?: string;
    scrapedData?: ScrapedData;
    personalNotes: string;
    promptTemplate: string;
    businessContext: string;
    business_name?: string;
}

export interface EmailData {
    to: string;
    subject: string;
    htmlContent: string;
    fromName: string;
    fromEmail: string;
}

export interface UserFriendlyError {
    message: string;
    code: string;
    retryable: boolean;
    suggestedAction?: string;
}

// Re-export email template types
export type {
    EmailTemplate,
    RenderedEmail
} from './email-template.js';