import type { EmailTemplate, RenderedEmail } from '../types/email-template.js';
import { EmailTemplateService } from './EmailTemplateService.js';
import { DEFAULT_EMAIL_TEMPLATE } from '../templates/default-email-template.js';
import { ALL_TEMPLATE_VARIANTS } from '../templates/template-variants.js';

/**
 * Template Manager - Manages email templates
 * Templates are HTML strings with {{CONTENT}} placeholder for AI-generated text
 */
export class TemplateManager {
    private templateService: EmailTemplateService;

    constructor() {
        this.templateService = new EmailTemplateService();
        this.initializeTemplates();
    }

    private initializeTemplates(): void {
        ALL_TEMPLATE_VARIANTS.forEach(template => {
            this.templateService.saveTemplate(template);
        });
    }

    getAllTemplates(): EmailTemplate[] {
        return this.templateService.getAllTemplates();
    }

    getDefaultTemplate(): EmailTemplate {
        return this.templateService.getDefaultTemplate();
    }

    getTemplate(templateId: string): EmailTemplate | null {
        return this.templateService.getTemplate(templateId);
    }

    /**
     * Render email by inserting content into template
     */
    renderEmail(templateId: string, content: string): RenderedEmail {
        return this.templateService.renderEmail(templateId, content);
    }

    /**
     * Preview a template with sample content
     */
    previewTemplate(templateId: string): RenderedEmail {
        return this.templateService.previewTemplate(templateId);
    }

    /**
     * Save a new custom template
     */
    saveTemplate(template: EmailTemplate): void {
        this.templateService.saveTemplate(template);
    }

    /**
     * Delete a template
     */
    deleteTemplate(templateId: string): void {
        const template = this.getTemplate(templateId);
        if (template && !template.isDefault) {
            // Remove from service (you'll need to add this method to EmailTemplateService)
            this.templateService.getAllTemplates();
        }
    }
}