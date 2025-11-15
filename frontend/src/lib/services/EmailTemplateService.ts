import type { EmailTemplate, RenderedEmail } from '../types/email-template.js';
import { DEFAULT_EMAIL_TEMPLATE } from '../templates/default-email-template.js';

export class EmailTemplateService {
    private templates: Map<string, EmailTemplate> = new Map();

    constructor() {
        this.templates.set(DEFAULT_EMAIL_TEMPLATE.id, DEFAULT_EMAIL_TEMPLATE);
    }

    getAllTemplates(): EmailTemplate[] {
        return Array.from(this.templates.values());
    }

    getTemplate(templateId: string): EmailTemplate | null {
        return this.templates.get(templateId) || null;
    }

    getDefaultTemplate(): EmailTemplate {
        return DEFAULT_EMAIL_TEMPLATE;
    }

    saveTemplate(template: EmailTemplate): void {
        this.templates.set(template.id, template);
    }

    /**
     * Render email by replacing {{CONTENT}} and {{BUSINESS_NAME}} with the provided values
     */
    renderEmail(templateId: string, content: string, businessName?: string): RenderedEmail {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Template with ID ${templateId} not found`);
        }

        let htmlContent = template.htmlTemplate.replace(/\{\{CONTENT\}\}/g, content);

        // Replace BUSINESS_NAME placeholder if provided
        if (businessName) {
            htmlContent = htmlContent.replace(/\{\{BUSINESS_NAME\}\}/g, businessName);
        }

        const textContent = this.htmlToText(htmlContent);

        return {
            htmlContent,
            textContent
        };
    }

    /**
     * Simple HTML to text conversion
     */
    private htmlToText(html: string): string {
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Preview template with sample content
     */
    previewTemplate(templateId: string): RenderedEmail {
        const sampleContent = `
            <p>Hi John,</p>
            <p>I hope this email finds you well. I wanted to reach out because I believe there's a great opportunity for our companies to work together.</p>
            <p>Best regards,<br>Jane Doe</p>
        `;
        return this.renderEmail(templateId, sampleContent);
    }
}