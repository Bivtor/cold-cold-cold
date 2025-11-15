import type { EmailTemplate } from '../types/email-template.js';

export const DEFAULT_EMAIL_TEMPLATE: EmailTemplate = {
    id: 'plain-text',
    name: 'Plain Text',
    description: 'Simple plain text email',
    htmlTemplate: '<p>Hi {{BUSINESS_NAME}},</p>\n\n{{CONTENT}}',
    isDefault: true
};