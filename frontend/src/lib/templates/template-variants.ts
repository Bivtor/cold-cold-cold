import type { EmailTemplate } from '../types/email-template.js';

export const MINIMAL_TEMPLATE: EmailTemplate = {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Simple, clean template with minimal styling for a personal touch',
    header: {
        companyName: '{{SENDER_COMPANY}}',
        showHeader: false
    },
    body: {
        greeting: 'Hi {{RECIPIENT_NAME}},',
        mainContent: '{{CUSTOM_CONTENT}}',
        callToAction: 'I\'d love to hear your thoughts on this.',
        showCallToAction: true
    },
    footer: {
        signature: '{{SENDER_NAME}}{{SENDER_TITLE}}{{SENDER_COMPANY}}',
        contactInfo: '{{SENDER_EMAIL}}{{SENDER_PHONE}}',
        showFooter: true
    },
    styling: {
        primaryColor: '#000000',
        secondaryColor: '#666666',
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '16px',
        maxWidth: '500px',
        backgroundColor: '#ffffff',
        textColor: '#333333',
        linkColor: '#000000'
    },
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
};

export const MODERN_TEMPLATE: EmailTemplate = {
    id: 'modern-gradient',
    name: 'Modern Gradient',
    description: 'Contemporary design with gradient header and modern typography',
    header: {
        companyName: '{{SENDER_COMPANY}}',
        showHeader: true
    },
    body: {
        greeting: 'Hello {{RECIPIENT_NAME}},',
        mainContent: '{{CUSTOM_CONTENT}}',
        callToAction: 'Ready to take {{RECIPIENT_COMPANY}} to the next level?',
        showCallToAction: true
    },
    footer: {
        signature: '{{SENDER_NAME}}{{SENDER_TITLE}}{{SENDER_COMPANY}}',
        contactInfo: '{{SENDER_EMAIL}}{{SENDER_PHONE}}',
        showFooter: true
    },
    styling: {
        primaryColor: '#6366f1',
        secondaryColor: '#8b5cf6',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: '16px',
        maxWidth: '650px',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        linkColor: '#6366f1'
    },
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
};

export const CORPORATE_TEMPLATE: EmailTemplate = {
    id: 'corporate-formal',
    name: 'Corporate Formal',
    description: 'Professional corporate template suitable for B2B communications',
    header: {
        companyName: '{{SENDER_COMPANY}}',
        showHeader: true
    },
    body: {
        greeting: 'Dear {{RECIPIENT_NAME}},',
        mainContent: '{{CUSTOM_CONTENT}}',
        callToAction: 'We would welcome the opportunity to discuss this proposal with {{RECIPIENT_COMPANY}} in more detail.',
        showCallToAction: true
    },
    footer: {
        signature: '{{SENDER_NAME}}{{SENDER_TITLE}}{{SENDER_COMPANY}}',
        contactInfo: '{{SENDER_EMAIL}}{{SENDER_PHONE}}',
        showFooter: true
    },
    styling: {
        primaryColor: '#1e40af',
        secondaryColor: '#64748b',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: '15px',
        maxWidth: '600px',
        backgroundColor: '#ffffff',
        textColor: '#374151',
        linkColor: '#1e40af'
    },
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
};

export const CREATIVE_TEMPLATE: EmailTemplate = {
    id: 'creative-colorful',
    name: 'Creative Colorful',
    description: 'Vibrant, creative template for agencies and creative businesses',
    header: {
        companyName: '{{SENDER_COMPANY}}',
        showHeader: true
    },
    body: {
        greeting: 'Hey {{RECIPIENT_NAME}}! 👋',
        mainContent: '{{CUSTOM_CONTENT}}',
        callToAction: 'Let\'s create something amazing together! 🚀',
        showCallToAction: true
    },
    footer: {
        signature: '{{SENDER_NAME}}{{SENDER_TITLE}}{{SENDER_COMPANY}}',
        contactInfo: '{{SENDER_EMAIL}}{{SENDER_PHONE}}',
        showFooter: true
    },
    styling: {
        primaryColor: '#f59e0b',
        secondaryColor: '#ef4444',
        fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: '16px',
        maxWidth: '600px',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        linkColor: '#f59e0b'
    },
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
};

export const ALL_TEMPLATE_VARIANTS = [
    MINIMAL_TEMPLATE,
    MODERN_TEMPLATE,
    CORPORATE_TEMPLATE,
    CREATIVE_TEMPLATE
] as const;