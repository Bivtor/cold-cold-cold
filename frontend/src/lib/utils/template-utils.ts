import type { EmailTemplate, EmailTemplateData } from '../types/email-template.js';

/**
 * Utility functions for email template operations
 */

/**
 * Generate sample data for template testing
 */
export function generateSampleTemplateData(overrides: Partial<EmailTemplateData> = {}): EmailTemplateData {
    return {
        recipientName: 'John Smith',
        recipientCompany: 'Acme Corporation',
        senderName: 'Jane Doe',
        senderTitle: 'Business Development Manager',
        senderCompany: 'Your Company',
        senderEmail: 'jane.doe@yourcompany.com',
        senderPhone: '+1 (555) 123-4567',
        customContent: 'I hope this email finds you well. I wanted to reach out because I believe there\'s a great opportunity for our companies to work together.\n\nOur team has been following your company\'s impressive growth in the market, and we think our solutions could help accelerate your success even further.',
        callToActionText: 'Would you be available for a brief 15-minute call next week to explore this opportunity?',
        unsubscribeUrl: 'https://yourcompany.com/unsubscribe',
        ...overrides
    };
}

/**
 * Validate email template structure
 */
export function validateEmailTemplate(template: EmailTemplate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!template.id?.trim()) {
        errors.push('Template ID is required');
    }

    if (!template.name?.trim()) {
        errors.push('Template name is required');
    }

    if (!template.styling) {
        errors.push('Template styling configuration is required');
    } else {
        // Validate styling properties
        if (!template.styling.primaryColor?.trim()) {
            errors.push('Primary color is required');
        }

        if (!template.styling.fontFamily?.trim()) {
            errors.push('Font family is required');
        }

        if (!template.styling.fontSize?.trim()) {
            errors.push('Font size is required');
        }

        if (!template.styling.maxWidth?.trim()) {
            errors.push('Max width is required');
        }

        // Validate color formats (basic validation)
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (template.styling.primaryColor && !colorRegex.test(template.styling.primaryColor)) {
            errors.push('Primary color must be a valid hex color');
        }

        if (template.styling.secondaryColor && !colorRegex.test(template.styling.secondaryColor)) {
            errors.push('Secondary color must be a valid hex color');
        }

        if (template.styling.backgroundColor && !colorRegex.test(template.styling.backgroundColor)) {
            errors.push('Background color must be a valid hex color');
        }

        if (template.styling.textColor && !colorRegex.test(template.styling.textColor)) {
            errors.push('Text color must be a valid hex color');
        }

        if (template.styling.linkColor && !colorRegex.test(template.styling.linkColor)) {
            errors.push('Link color must be a valid hex color');
        }
    }

    // Validate structure
    if (!template.header) {
        errors.push('Template header configuration is required');
    }

    if (!template.body) {
        errors.push('Template body configuration is required');
    }

    if (!template.footer) {
        errors.push('Template footer configuration is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Extract colors from template for color palette display
 */
export function extractTemplateColors(template: EmailTemplate): string[] {
    const colors: string[] = [];

    if (template.styling.primaryColor) colors.push(template.styling.primaryColor);
    if (template.styling.secondaryColor) colors.push(template.styling.secondaryColor);
    if (template.styling.backgroundColor) colors.push(template.styling.backgroundColor);
    if (template.styling.textColor) colors.push(template.styling.textColor);
    if (template.styling.linkColor) colors.push(template.styling.linkColor);

    // Remove duplicates
    return [...new Set(colors)];
}

/**
 * Generate CSS variables from template styling
 */
export function generateCSSVariables(template: EmailTemplate): Record<string, string> {
    return {
        '--template-primary-color': template.styling.primaryColor,
        '--template-secondary-color': template.styling.secondaryColor,
        '--template-background-color': template.styling.backgroundColor,
        '--template-text-color': template.styling.textColor,
        '--template-link-color': template.styling.linkColor,
        '--template-font-family': template.styling.fontFamily,
        '--template-font-size': template.styling.fontSize,
        '--template-max-width': template.styling.maxWidth
    };
}

/**
 * Convert template to CSS string for preview
 */
export function templateToCSSString(template: EmailTemplate): string {
    const variables = generateCSSVariables(template);
    return Object.entries(variables)
        .map(([key, value]) => `${key}: ${value};`)
        .join('\n');
}

/**
 * Estimate email size in KB
 */
export function estimateEmailSize(htmlContent: string): number {
    // Rough estimation: 1 character ≈ 1 byte
    const sizeInBytes = new Blob([htmlContent]).size;
    return Math.round(sizeInBytes / 1024 * 100) / 100; // Round to 2 decimal places
}

/**
 * Check if email size is within recommended limits
 */
export function validateEmailSize(htmlContent: string): { isValid: boolean; size: number; warning?: string } {
    const sizeKB = estimateEmailSize(htmlContent);

    if (sizeKB > 102) { // Gmail clips emails over 102KB
        return {
            isValid: false,
            size: sizeKB,
            warning: 'Email size exceeds 102KB limit. Gmail may clip this email.'
        };
    }

    if (sizeKB > 50) {
        return {
            isValid: true,
            size: sizeKB,
            warning: 'Email size is large. Consider optimizing for better deliverability.'
        };
    }

    return {
        isValid: true,
        size: sizeKB
    };
}

/**
 * Clean HTML for email clients
 */
export function cleanHtmlForEmail(html: string): string {
    // Remove script tags
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove link tags (except for CSS)
    html = html.replace(/<link(?![^>]*rel=["']stylesheet["'])[^>]*>/gi, '');

    // Remove form elements
    html = html.replace(/<(form|input|textarea|select|button)[^>]*>.*?<\/\1>/gi, '');

    // Remove object and embed tags
    html = html.replace(/<(object|embed)[^>]*>.*?<\/\1>/gi, '');

    return html;
}

/**
 * Generate template thumbnail/preview image data URL
 */
export function generateTemplateThumbnail(template: EmailTemplate): string {
    // This would generate a small preview image of the template
    // For now, return a simple colored rectangle as placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');

    if (ctx) {
        // Background
        ctx.fillStyle = template.styling.backgroundColor;
        ctx.fillRect(0, 0, 200, 150);

        // Header
        ctx.fillStyle = template.styling.primaryColor;
        ctx.fillRect(0, 0, 200, 30);

        // Content area
        ctx.fillStyle = template.styling.textColor;
        ctx.fillRect(10, 40, 180, 5);
        ctx.fillRect(10, 50, 160, 5);
        ctx.fillRect(10, 60, 170, 5);

        // CTA area
        ctx.fillStyle = template.styling.primaryColor;
        ctx.fillRect(10, 80, 80, 20);
    }

    return canvas.toDataURL();
}