import type { EmailTemplate } from '../types/email-template.js';

export const PLAIN_TEXT_TEMPLATE: EmailTemplate = {
    id: 'plain-text',
    name: 'Plain Text',
    description: 'Simple plain text email with no styling',
    htmlTemplate: '{{CONTENT}}',
    isDefault: true
};

export const SIMPLE_HTML_TEMPLATE: EmailTemplate = {
    id: 'simple-html',
    name: 'Simple HTML',
    description: 'Basic HTML formatting with minimal styling',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .content { max-width: 600px; margin: 0 auto; padding: 20px; }
    </style>
</head>
<body>
    <div class="content">
        {{CONTENT}}
    </div>
</body>
</html>
    `.trim(),
    isDefault: false
};

export const PROFESSIONAL_TEMPLATE: EmailTemplate = {
    id: 'professional',
    name: 'Professional',
    description: 'Clean professional template with header and footer',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.6; color: #374151; background: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #2563eb; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .footer { background: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Professional Email</h1>
        </div>
        <div class="content">
            {{CONTENT}}
        </div>
        <div class="footer">
            Sent with Cold Email Pipeline
        </div>
    </div>
</body>
</html>
    `.trim(),
    isDefault: false
};

export const ALL_TEMPLATE_VARIANTS = [
    PLAIN_TEXT_TEMPLATE,
    SIMPLE_HTML_TEMPLATE,
    PROFESSIONAL_TEMPLATE
] as const;