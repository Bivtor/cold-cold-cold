import type {
    EmailTemplate,
    EmailTemplateData,
    RenderedEmail,
    TemplateCustomization,
    PlaceholderKey
} from '../types/email-template.js';
import { TEMPLATE_PLACEHOLDERS } from '../types/email-template.js';
import { DEFAULT_EMAIL_TEMPLATE, generateDefaultHtmlTemplate } from '../templates/default-email-template.js';

export class EmailTemplateService {
    private templates: Map<string, EmailTemplate> = new Map();

    constructor() {
        // Initialize with default template
        this.templates.set(DEFAULT_EMAIL_TEMPLATE.id, DEFAULT_EMAIL_TEMPLATE);
    }

    /**
     * Get all available templates
     */
    getAllTemplates(): EmailTemplate[] {
        return Array.from(this.templates.values());
    }

    /**
     * Get a specific template by ID
     */
    getTemplate(templateId: string): EmailTemplate | null {
        return this.templates.get(templateId) || null;
    }

    /**
     * Get the default template
     */
    getDefaultTemplate(): EmailTemplate {
        return DEFAULT_EMAIL_TEMPLATE;
    }

    /**
     * Add or update a template
     */
    saveTemplate(template: EmailTemplate): void {
        template.updatedAt = new Date();
        this.templates.set(template.id, template);
    }

    /**
     * Create a customized version of a template
     */
    customizeTemplate(customization: TemplateCustomization): EmailTemplate {
        const baseTemplate = this.getTemplate(customization.templateId);
        if (!baseTemplate) {
            throw new Error(`Template with ID ${customization.templateId} not found`);
        }

        const customizedTemplate: EmailTemplate = {
            ...baseTemplate,
            ...customization.customizations,
            id: `${baseTemplate.id}-custom-${Date.now()}`,
            name: `${baseTemplate.name} (Custom)`,
            isDefault: false,
            updatedAt: new Date()
        };

        this.saveTemplate(customizedTemplate);
        return customizedTemplate;
    }

    /**
     * Render an email using a template and data
     */
    renderEmail(templateId: string, data: EmailTemplateData): RenderedEmail {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Template with ID ${templateId} not found`);
        }

        // Generate the base HTML template
        let htmlContent = this.generateHtmlFromTemplate(template);

        // Replace placeholders with actual data
        htmlContent = this.replacePlaceholders(htmlContent, data);

        // Generate text version (simplified)
        const textContent = this.generateTextVersion(htmlContent, data);

        // Generate subject line
        const subject = this.generateSubject(data);

        return {
            htmlContent,
            textContent,
            subject
        };
    }

    /**
     * Generate HTML from template configuration
     */
    private generateHtmlFromTemplate(template: EmailTemplate): string {
        // For now, use the default HTML structure but apply template styling
        let html = generateDefaultHtmlTemplate();

        // Apply custom styling
        html = html.replace(/font-family: [^;]+;/g, `font-family: ${template.styling.fontFamily};`);
        html = html.replace(/font-size: [^;]+;/g, `font-size: ${template.styling.fontSize};`);
        html = html.replace(/max-width: [^;]+;/g, `max-width: ${template.styling.maxWidth};`);
        html = html.replace(/background-color: #ffffff/g, `background-color: ${template.styling.backgroundColor}`);
        html = html.replace(/color: #374151/g, `color: ${template.styling.textColor}`);
        html = html.replace(/background-color: #2563eb/g, `background-color: ${template.styling.primaryColor}`);
        html = html.replace(/color: #64748b/g, `color: ${template.styling.secondaryColor}`);
        html = html.replace(/color: #2563eb/g, `color: ${template.styling.linkColor}`);

        // Apply template content structure
        if (!template.header.showHeader) {
            html = html.replace(/<div class="email-header">[\s\S]*?<\/div>/, '');
        }

        if (!template.body.showCallToAction) {
            html = html.replace(/<div class="call-to-action">[\s\S]*?<\/div>/, '');
        }

        if (!template.footer.showFooter) {
            html = html.replace(/<div class="email-footer">[\s\S]*?<\/div>/, '');
        }

        return html;
    }

    /**
     * Replace placeholders in the HTML content with actual data
     */
    private replacePlaceholders(html: string, data: EmailTemplateData): string {
        let result = html;

        // Replace all placeholders with proper escaping
        result = result.replace(/\{\{RECIPIENT_NAME\}\}/g, data.recipientName || '');
        result = result.replace(/\{\{RECIPIENT_COMPANY\}\}/g, data.recipientCompany || '');
        result = result.replace(/\{\{SENDER_NAME\}\}/g, data.senderName);
        result = result.replace(/\{\{SENDER_TITLE\}\}/g, data.senderTitle || '');
        result = result.replace(/\{\{SENDER_COMPANY\}\}/g, data.senderCompany);
        result = result.replace(/\{\{SENDER_EMAIL\}\}/g, data.senderEmail);
        result = result.replace(/\{\{SENDER_PHONE\}\}/g, data.senderPhone ? ` • ${data.senderPhone}` : '');
        result = result.replace(/\{\{CUSTOM_CONTENT\}\}/g, this.formatCustomContent(data.customContent));
        result = result.replace(/\{\{CALL_TO_ACTION_TEXT\}\}/g, data.callToActionText || this.getDefaultCallToAction(data));
        result = result.replace(/\{\{CALL_TO_ACTION_URL\}\}/g, data.callToActionUrl || '');
        result = result.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, data.unsubscribeUrl || '');
        result = result.replace(/\{\{CURRENT_DATE\}\}/g, new Date().toLocaleDateString());
        result = result.replace(/\{\{CURRENT_YEAR\}\}/g, new Date().getFullYear().toString());

        // Handle greeting with fallback
        if (data.recipientName) {
            result = result.replace(/Hi \{\{RECIPIENT_NAME\}\},/g, `Hi ${data.recipientName},`);
        } else {
            result = result.replace(/Hi \{\{RECIPIENT_NAME\}\},/g, 'Hello,');
        }

        // Clean up empty conditional sections
        result = this.cleanupConditionalContent(result);

        return result;
    }

    /**
     * Get default call to action text
     */
    private getDefaultCallToAction(data: EmailTemplateData): string {
        if (data.recipientCompany) {
            return `Let's connect and discuss how we can help ${data.recipientCompany} achieve its goals.`;
        }
        return "Let's connect and discuss how we can help your company achieve its goals.";
    }

    /**
     * Format custom content for HTML display
     */
    private formatCustomContent(content: string): string {
        // Convert line breaks to HTML paragraphs
        const paragraphs = content.split('\n\n').filter(p => p.trim());
        return paragraphs.map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`).join('\n');
    }

    /**
     * Clean up conditional content that has empty placeholders
     */
    private cleanupConditionalContent(html: string): string {
        // Remove empty conditional sections
        html = html.replace(/\$\{[^}]*\?\s*`[^`]*`\s*:\s*''\}/g, '');

        // Remove lines that only contain empty placeholders
        html = html.replace(/^\s*\$\{[^}]*\|\|[^}]*\}\s*$/gm, '');

        // Clean up multiple consecutive line breaks
        html = html.replace(/\n\s*\n\s*\n/g, '\n\n');

        return html;
    }

    /**
     * Generate a plain text version of the email
     */
    private generateTextVersion(html: string, data: EmailTemplateData): string {
        // Simple HTML to text conversion
        let text = html;

        // Remove HTML tags
        text = text.replace(/<[^>]*>/g, '');

        // Decode HTML entities
        text = text.replace(/&nbsp;/g, ' ');
        text = text.replace(/&amp;/g, '&');
        text = text.replace(/&lt;/g, '<');
        text = text.replace(/&gt;/g, '>');
        text = text.replace(/&quot;/g, '"');

        // Clean up whitespace
        text = text.replace(/\s+/g, ' ');
        text = text.replace(/\n\s+/g, '\n');
        text = text.trim();

        // Add basic structure
        let textContent = '';

        if (data.recipientName) {
            textContent += `Hi ${data.recipientName},\n\n`;
        } else {
            textContent += 'Hello,\n\n';
        }

        textContent += data.customContent + '\n\n';

        if (data.callToActionText) {
            textContent += data.callToActionText + '\n\n';
        }

        textContent += `Best regards,\n${data.senderName}\n`;
        if (data.senderTitle) {
            textContent += `${data.senderTitle}\n`;
        }
        textContent += `${data.senderCompany}\n`;
        textContent += `${data.senderEmail}`;
        if (data.senderPhone) {
            textContent += ` • ${data.senderPhone}`;
        }

        return textContent;
    }

    /**
     * Generate a subject line based on the data
     */
    private generateSubject(data: EmailTemplateData): string {
        if (data.recipientCompany) {
            return `Partnership Opportunity for ${data.recipientCompany}`;
        }
        return 'Partnership Opportunity';
    }

    /**
     * Validate template data
     */
    validateTemplateData(data: EmailTemplateData): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.senderName?.trim()) {
            errors.push('Sender name is required');
        }

        if (!data.senderCompany?.trim()) {
            errors.push('Sender company is required');
        }

        if (!data.senderEmail?.trim()) {
            errors.push('Sender email is required');
        } else if (!this.isValidEmail(data.senderEmail)) {
            errors.push('Sender email must be a valid email address');
        }

        if (!data.customContent?.trim()) {
            errors.push('Custom content is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Simple email validation
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Preview template with sample data
     */
    previewTemplate(templateId: string): RenderedEmail {
        const sampleData: EmailTemplateData = {
            recipientName: 'John Smith',
            recipientCompany: 'Acme Corporation',
            senderName: 'Jane Doe',
            senderTitle: 'Business Development Manager',
            senderCompany: 'Your Company',
            senderEmail: 'jane.doe@yourcompany.com',
            senderPhone: '+1 (555) 123-4567',
            customContent: 'I hope this email finds you well. I wanted to reach out because I believe there\'s a great opportunity for our companies to work together.\n\nOur team has been following Acme Corporation\'s impressive growth in the market, and we think our solutions could help accelerate your success even further.',
            callToActionText: 'Would you be available for a brief 15-minute call next week to explore this opportunity?',
            unsubscribeUrl: 'https://yourcompany.com/unsubscribe'
        };

        return this.renderEmail(templateId, sampleData);
    }
}