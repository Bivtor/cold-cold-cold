// Email template types and interfaces

export interface EmailTemplate {
    id: string;
    name: string;
    description: string;
    htmlTemplate: string; // HTML string with {{CONTENT}} placeholder for AI-generated text
    isDefault: boolean;
}

export interface RenderedEmail {
    htmlContent: string;
    textContent: string;
}