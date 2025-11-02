import { describe, it, expect, beforeEach } from 'vitest';
import { EmailTemplateService } from './EmailTemplateService.js';
import { TemplateManager } from './TemplateManager.js';
import type { EmailTemplateData } from '../types/email-template.js';
import { generateSampleTemplateData, validateEmailTemplate } from '../utils/template-utils.js';

describe('EmailTemplateService', () => {
    let templateService: EmailTemplateService;

    beforeEach(() => {
        templateService = new EmailTemplateService();
    });

    it('should initialize with default template', () => {
        const templates = templateService.getAllTemplates();
        expect(templates.length).toBeGreaterThan(0);

        const defaultTemplate = templateService.getDefaultTemplate();
        expect(defaultTemplate).toBeDefined();
        expect(defaultTemplate.isDefault).toBe(true);
    });

    it('should render email with template data', () => {
        const templateData: EmailTemplateData = {
            recipientName: 'John Doe',
            recipientCompany: 'Test Corp',
            senderName: 'Jane Smith',
            senderCompany: 'My Company',
            senderEmail: 'jane@mycompany.com',
            customContent: 'This is a test email content.'
        };

        const defaultTemplate = templateService.getDefaultTemplate();
        const renderedEmail = templateService.renderEmail(defaultTemplate.id, templateData);

        expect(renderedEmail.htmlContent).toContain('John Doe');
        expect(renderedEmail.htmlContent).toContain('Test Corp');
        expect(renderedEmail.htmlContent).toContain('Jane Smith');
        expect(renderedEmail.htmlContent).toContain('My Company');
        expect(renderedEmail.htmlContent).toContain('This is a test email content.');
        expect(renderedEmail.textContent).toBeDefined();
        expect(renderedEmail.subject).toBeDefined();
    });

    it('should validate template data correctly', () => {
        const validData: EmailTemplateData = {
            senderName: 'John Doe',
            senderCompany: 'Test Corp',
            senderEmail: 'john@testcorp.com',
            customContent: 'Valid content'
        };

        const validation = templateService.validateTemplateData(validData);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid data', () => {
        const invalidData: EmailTemplateData = {
            senderName: '',
            senderCompany: '',
            senderEmail: 'invalid-email',
            customContent: ''
        };

        const validation = templateService.validateTemplateData(invalidData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should generate preview with sample data', () => {
        const defaultTemplate = templateService.getDefaultTemplate();
        const preview = templateService.previewTemplate(defaultTemplate.id);

        expect(preview.htmlContent).toBeDefined();
        expect(preview.textContent).toBeDefined();
        expect(preview.subject).toBeDefined();
        expect(preview.htmlContent).toContain('John Smith'); // Sample recipient name
    });
});

describe('TemplateManager', () => {
    let templateManager: TemplateManager;

    beforeEach(() => {
        templateManager = new TemplateManager();
    });

    it('should initialize with multiple templates', () => {
        const templates = templateManager.getAllTemplates();
        expect(templates.length).toBeGreaterThan(1); // Should have default + variants
    });

    it('should get templates by type', () => {
        const professionalTemplates = templateManager.getTemplatesByType('professional');
        const minimalTemplates = templateManager.getTemplatesByType('minimal');

        expect(professionalTemplates.length).toBeGreaterThan(0);
        expect(minimalTemplates.length).toBeGreaterThan(0);
    });

    it('should create quick email', () => {
        const quickEmail = templateManager.createQuickEmail({
            recipientName: 'Test User',
            customContent: 'Quick test content',
            senderName: 'Sender Name',
            senderCompany: 'Sender Company',
            senderEmail: 'sender@company.com'
        });

        expect(quickEmail.htmlContent).toContain('Test User');
        expect(quickEmail.htmlContent).toContain('Quick test content');
    });

    it('should provide template recommendations', () => {
        const recommendations = templateManager.getTemplateRecommendations('partnership opportunity');
        expect(recommendations.length).toBeGreaterThan(0);

        const creativeRecommendations = templateManager.getTemplateRecommendations('creative design project');
        expect(creativeRecommendations.length).toBeGreaterThan(0);
    });

    it('should clone template successfully', () => {
        const defaultTemplate = templateManager.getDefaultTemplate();
        const clonedTemplate = templateManager.cloneTemplate(defaultTemplate.id, 'Cloned Template');

        expect(clonedTemplate.name).toBe('Cloned Template');
        expect(clonedTemplate.id).not.toBe(defaultTemplate.id);
        expect(clonedTemplate.isDefault).toBe(false);
    });
});

describe('Template Utils', () => {
    it('should generate valid sample data', () => {
        const sampleData = generateSampleTemplateData();

        expect(sampleData.senderName).toBeDefined();
        expect(sampleData.senderEmail).toBeDefined();
        expect(sampleData.customContent).toBeDefined();
    });

    it('should validate template structure', () => {
        const templateManager = new TemplateManager();
        const defaultTemplate = templateManager.getDefaultTemplate();

        const validation = validateEmailTemplate(defaultTemplate);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
    });
});