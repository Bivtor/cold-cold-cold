import type { EmailTemplate, EmailTemplateData, RenderedEmail } from '../types/email-template.js';
import { EmailTemplateService } from './EmailTemplateService.js';
import { DEFAULT_EMAIL_TEMPLATE } from '../templates/default-email-template.js';
import { ALL_TEMPLATE_VARIANTS } from '../templates/template-variants.js';

/**
 * Template Manager - Central service for managing email templates
 * Provides a unified interface for template operations
 */
export class TemplateManager {
    private templateService: EmailTemplateService;

    constructor() {
        this.templateService = new EmailTemplateService();
        this.initializeTemplates();
    }

    /**
     * Initialize all available templates
     */
    private initializeTemplates(): void {
        // Add all template variants
        ALL_TEMPLATE_VARIANTS.forEach(template => {
            this.templateService.saveTemplate(template);
        });
    }

    /**
     * Get all available templates
     */
    getAllTemplates(): EmailTemplate[] {
        return this.templateService.getAllTemplates();
    }

    /**
     * Get templates by category/type
     */
    getTemplatesByType(type: 'professional' | 'minimal' | 'modern' | 'corporate' | 'creative'): EmailTemplate[] {
        const allTemplates = this.getAllTemplates();

        switch (type) {
            case 'professional':
                return allTemplates.filter(t => t.id.includes('professional') || t.isDefault);
            case 'minimal':
                return allTemplates.filter(t => t.id.includes('minimal') || t.id.includes('clean'));
            case 'modern':
                return allTemplates.filter(t => t.id.includes('modern') || t.id.includes('gradient'));
            case 'corporate':
                return allTemplates.filter(t => t.id.includes('corporate') || t.id.includes('formal'));
            case 'creative':
                return allTemplates.filter(t => t.id.includes('creative') || t.id.includes('colorful'));
            default:
                return allTemplates;
        }
    }

    /**
     * Get the default template
     */
    getDefaultTemplate(): EmailTemplate {
        return this.templateService.getDefaultTemplate();
    }

    /**
     * Get a specific template by ID
     */
    getTemplate(templateId: string): EmailTemplate | null {
        return this.templateService.getTemplate(templateId);
    }

    /**
     * Render an email using a template
     */
    renderEmail(templateId: string, data: EmailTemplateData): RenderedEmail {
        return this.templateService.renderEmail(templateId, data);
    }

    /**
     * Render email using the default template
     */
    renderEmailWithDefault(data: EmailTemplateData): RenderedEmail {
        return this.templateService.renderEmail(DEFAULT_EMAIL_TEMPLATE.id, data);
    }

    /**
     * Preview a template with sample data
     */
    previewTemplate(templateId: string): RenderedEmail {
        return this.templateService.previewTemplate(templateId);
    }

    /**
     * Validate template data
     */
    validateTemplateData(data: EmailTemplateData): { isValid: boolean; errors: string[] } {
        return this.templateService.validateTemplateData(data);
    }

    /**
     * Create a quick email with minimal data
     */
    createQuickEmail(params: {
        recipientName?: string;
        recipientCompany?: string;
        customContent: string;
        senderName: string;
        senderCompany: string;
        senderEmail: string;
        templateId?: string;
    }): RenderedEmail {
        const templateData: EmailTemplateData = {
            recipientName: params.recipientName,
            recipientCompany: params.recipientCompany,
            senderName: params.senderName,
            senderCompany: params.senderCompany,
            senderEmail: params.senderEmail,
            customContent: params.customContent
        };

        const templateId = params.templateId || DEFAULT_EMAIL_TEMPLATE.id;
        return this.renderEmail(templateId, templateData);
    }

    /**
     * Get template recommendations based on content analysis
     */
    getTemplateRecommendations(content: string, recipientCompany?: string): EmailTemplate[] {
        const contentLower = content.toLowerCase();
        const recommendations: EmailTemplate[] = [];

        // Analyze content to suggest appropriate templates
        if (contentLower.includes('partnership') || contentLower.includes('collaboration')) {
            const corporateTemplate = this.getTemplate('corporate-formal');
            if (corporateTemplate) recommendations.push(corporateTemplate);
        }

        if (contentLower.includes('creative') || contentLower.includes('design') || contentLower.includes('marketing')) {
            const creativeTemplate = this.getTemplate('creative-colorful');
            if (creativeTemplate) recommendations.push(creativeTemplate);
        }

        if (contentLower.includes('startup') || contentLower.includes('innovation') || contentLower.includes('tech')) {
            const modernTemplate = this.getTemplate('modern-gradient');
            if (modernTemplate) recommendations.push(modernTemplate);
        }

        // If no specific recommendations, suggest default and minimal
        if (recommendations.length === 0) {
            recommendations.push(this.getDefaultTemplate());
            const minimalTemplate = this.getTemplate('minimal-clean');
            if (minimalTemplate) recommendations.push(minimalTemplate);
        }

        return recommendations.slice(0, 3); // Return top 3 recommendations
    }

    /**
     * Export template as JSON
     */
    exportTemplate(templateId: string): string | null {
        const template = this.getTemplate(templateId);
        if (!template) return null;

        return JSON.stringify(template, null, 2);
    }

    /**
     * Import template from JSON
     */
    importTemplate(templateJson: string): EmailTemplate {
        try {
            const template = JSON.parse(templateJson) as EmailTemplate;

            // Validate required fields
            if (!template.id || !template.name || !template.styling) {
                throw new Error('Invalid template format');
            }

            // Ensure unique ID
            template.id = `imported-${template.id}-${Date.now()}`;
            template.isDefault = false;
            template.createdAt = new Date();
            template.updatedAt = new Date();

            this.templateService.saveTemplate(template);
            return template;
        } catch (error) {
            throw new Error(`Failed to import template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Clone an existing template
     */
    cloneTemplate(templateId: string, newName: string): EmailTemplate {
        const originalTemplate = this.getTemplate(templateId);
        if (!originalTemplate) {
            throw new Error(`Template with ID ${templateId} not found`);
        }

        const clonedTemplate: EmailTemplate = {
            ...originalTemplate,
            id: `cloned-${templateId}-${Date.now()}`,
            name: newName,
            description: `Cloned from ${originalTemplate.name}`,
            isDefault: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.templateService.saveTemplate(clonedTemplate);
        return clonedTemplate;
    }

    /**
     * Get template usage statistics (placeholder for future implementation)
     */
    getTemplateStats(): Record<string, { usageCount: number; lastUsed?: Date }> {
        // This would be implemented with actual usage tracking
        // For now, return empty stats
        return {};
    }
}