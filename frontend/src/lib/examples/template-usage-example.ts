/**
 * Example usage of the Email Template System
 * This file demonstrates how to use the various template services
 */

import { TemplateManager } from '../services/TemplateManager.js';
import type { EmailTemplateData } from '../types/email-template.js';
import { generateSampleTemplateData } from '../utils/template-utils.js';

// Initialize the template manager
const templateManager = new TemplateManager();

/**
 * Example 1: Basic email generation with default template
 */
export function createBasicEmail() {
    const emailData: EmailTemplateData = {
        recipientName: 'John Smith',
        recipientCompany: 'Acme Corporation',
        senderName: 'Jane Doe',
        senderTitle: 'Business Development Manager',
        senderCompany: 'Your Company',
        senderEmail: 'jane.doe@yourcompany.com',
        senderPhone: '+1 (555) 123-4567',
        customContent: `I hope this email finds you well. I wanted to reach out because I believe there's a great opportunity for our companies to work together.

Our team has been following Acme Corporation's impressive growth in the market, and we think our solutions could help accelerate your success even further.

We specialize in helping companies like yours streamline their operations and increase efficiency by up to 40%.`,
        callToActionText: 'Would you be available for a brief 15-minute call next week to explore this opportunity?'
    };

    const renderedEmail = templateManager.renderEmailWithDefault(emailData);

    console.log('Generated Email Subject:', renderedEmail.subject);
    console.log('HTML Content Length:', renderedEmail.htmlContent.length);
    console.log('Text Content:', renderedEmail.textContent);

    return renderedEmail;
}

/**
 * Example 2: Using different template styles
 */
export function createStyledEmails() {
    const baseData = generateSampleTemplateData({
        customContent: 'This is a test of different email template styles.'
    });

    const templates = templateManager.getAllTemplates();
    const results = [];

    for (const template of templates) {
        const renderedEmail = templateManager.renderEmail(template.id, baseData);
        results.push({
            templateName: template.name,
            templateId: template.id,
            email: renderedEmail
        });
    }

    return results;
}

/**
 * Example 3: Quick email creation
 */
export function createQuickEmail() {
    return templateManager.createQuickEmail({
        recipientName: 'Sarah Johnson',
        recipientCompany: 'Tech Innovations Inc.',
        customContent: 'I noticed your recent expansion into the European market and wanted to discuss how we can support your growth strategy.',
        senderName: 'Mike Wilson',
        senderCompany: 'Growth Partners LLC',
        senderEmail: 'mike@growthpartners.com',
        templateId: 'modern-gradient' // Use the modern template
    });
}

/**
 * Example 4: Template recommendations based on content
 */
export function getTemplateRecommendations() {
    const content1 = 'We are a creative agency looking to partner with innovative startups';
    const content2 = 'Our corporate consulting services can help streamline your business operations';
    const content3 = 'Partnership opportunity for technology collaboration';

    const recommendations1 = templateManager.getTemplateRecommendations(content1);
    const recommendations2 = templateManager.getTemplateRecommendations(content2);
    const recommendations3 = templateManager.getTemplateRecommendations(content3);

    return {
        creative: recommendations1.map(t => t.name),
        corporate: recommendations2.map(t => t.name),
        tech: recommendations3.map(t => t.name)
    };
}

/**
 * Example 5: Template preview
 */
export function previewAllTemplates() {
    const templates = templateManager.getAllTemplates();
    const previews = [];

    for (const template of templates) {
        const preview = templateManager.previewTemplate(template.id);
        previews.push({
            templateName: template.name,
            templateDescription: template.description,
            preview: {
                subject: preview.subject,
                htmlLength: preview.htmlContent.length,
                textLength: preview.textContent.length
            }
        });
    }

    return previews;
}

/**
 * Example 6: Template validation
 */
export function validateTemplateData() {
    // Valid data
    const validData: EmailTemplateData = {
        senderName: 'John Doe',
        senderCompany: 'Test Corp',
        senderEmail: 'john@testcorp.com',
        customContent: 'This is valid content'
    };

    // Invalid data
    const invalidData: EmailTemplateData = {
        senderName: '', // Empty name
        senderCompany: '', // Empty company
        senderEmail: 'invalid-email', // Invalid email format
        customContent: '' // Empty content
    };

    const validValidation = templateManager.validateTemplateData(validData);
    const invalidValidation = templateManager.validateTemplateData(invalidData);

    return {
        valid: validValidation,
        invalid: invalidValidation
    };
}

/**
 * Example 7: Clone and customize template
 */
export function cloneAndCustomizeTemplate() {
    const defaultTemplate = templateManager.getDefaultTemplate();

    // Clone the default template
    const clonedTemplate = templateManager.cloneTemplate(
        defaultTemplate.id,
        'My Custom Professional Template'
    );

    console.log('Original template:', defaultTemplate.name);
    console.log('Cloned template:', clonedTemplate.name);
    console.log('Cloned template ID:', clonedTemplate.id);

    return clonedTemplate;
}

// Export all examples for easy testing
export const examples = {
    createBasicEmail,
    createStyledEmails,
    createQuickEmail,
    getTemplateRecommendations,
    previewAllTemplates,
    validateTemplateData,
    cloneAndCustomizeTemplate
};

// If running this file directly (for testing)
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('=== Email Template System Examples ===\n');

    console.log('1. Basic Email:');
    const basicEmail = createBasicEmail();
    console.log('Subject:', basicEmail.subject);
    console.log('');

    console.log('2. Template Recommendations:');
    const recommendations = getTemplateRecommendations();
    console.log(recommendations);
    console.log('');

    console.log('3. Template Previews:');
    const previews = previewAllTemplates();
    previews.forEach(p => {
        console.log(`- ${p.templateName}: ${p.templateDescription}`);
    });
    console.log('');

    console.log('4. Validation Examples:');
    const validation = validateTemplateData();
    console.log('Valid data:', validation.valid.isValid);
    console.log('Invalid data errors:', validation.invalid.errors);
}