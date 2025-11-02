// Email template types and interfaces

export interface EmailTemplate {
    id: string;
    name: string;
    description: string;
    header: {
        logo?: string;
        companyName: string;
        showHeader: boolean;
    };
    body: {
        greeting: string;
        mainContent: string;
        callToAction: string;
        showCallToAction: boolean;
    };
    footer: {
        signature: string;
        contactInfo: string;
        unsubscribeLink?: string;
        showFooter: boolean;
    };
    styling: {
        primaryColor: string;
        secondaryColor: string;
        fontFamily: string;
        fontSize: string;
        maxWidth: string;
        backgroundColor: string;
        textColor: string;
        linkColor: string;
    };
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface EmailTemplateData {
    // Placeholders that can be replaced in the template
    recipientName?: string;
    recipientCompany?: string;
    senderName: string;
    senderTitle?: string;
    senderCompany: string;
    senderEmail: string;
    senderPhone?: string;
    customContent: string;
    callToActionText?: string;
    callToActionUrl?: string;
    unsubscribeUrl?: string;
}

export interface TemplateCustomization {
    templateId: string;
    customizations: Partial<EmailTemplate>;
}

export interface RenderedEmail {
    htmlContent: string;
    textContent: string;
    subject: string;
}

// Placeholder patterns for template replacement
export const TEMPLATE_PLACEHOLDERS = {
    RECIPIENT_NAME: '{{RECIPIENT_NAME}}',
    RECIPIENT_COMPANY: '{{RECIPIENT_COMPANY}}',
    SENDER_NAME: '{{SENDER_NAME}}',
    SENDER_TITLE: '{{SENDER_TITLE}}',
    SENDER_COMPANY: '{{SENDER_COMPANY}}',
    SENDER_EMAIL: '{{SENDER_EMAIL}}',
    SENDER_PHONE: '{{SENDER_PHONE}}',
    CUSTOM_CONTENT: '{{CUSTOM_CONTENT}}',
    CALL_TO_ACTION_TEXT: '{{CALL_TO_ACTION_TEXT}}',
    CALL_TO_ACTION_URL: '{{CALL_TO_ACTION_URL}}',
    UNSUBSCRIBE_URL: '{{UNSUBSCRIBE_URL}}',
    CURRENT_DATE: '{{CURRENT_DATE}}',
    CURRENT_YEAR: '{{CURRENT_YEAR}}'
} as const;

export type PlaceholderKey = keyof typeof TEMPLATE_PLACEHOLDERS;