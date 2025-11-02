import type { EmailTemplate } from '../types/email-template.js';
import { TEMPLATE_PLACEHOLDERS } from '../types/email-template.js';

export const DEFAULT_EMAIL_TEMPLATE: EmailTemplate = {
    id: 'default-professional',
    name: 'Professional Default',
    description: 'Clean, professional email template suitable for cold outreach',
    header: {
        companyName: '{{SENDER_COMPANY}}',
        showHeader: true
    },
    body: {
        greeting: 'Hi {{RECIPIENT_NAME}},',
        mainContent: '{{CUSTOM_CONTENT}}',
        callToAction: 'Let\'s connect and discuss how we can help {{RECIPIENT_COMPANY}} achieve its goals.',
        showCallToAction: true
    },
    footer: {
        signature: '{{SENDER_NAME}}{{SENDER_TITLE}}{{SENDER_COMPANY}}',
        contactInfo: '{{SENDER_EMAIL}}{{SENDER_PHONE}}',
        showFooter: true
    },
    styling: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '16px',
        maxWidth: '600px',
        backgroundColor: '#ffffff',
        textColor: '#374151',
        linkColor: '#2563eb'
    },
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
};

export function generateDefaultHtmlTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{{SENDER_COMPANY}} - Professional Outreach</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Reset styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }

        /* Base styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #f8fafc;
            font-family: ${DEFAULT_EMAIL_TEMPLATE.styling.fontFamily};
            font-size: ${DEFAULT_EMAIL_TEMPLATE.styling.fontSize};
            line-height: 1.6;
            color: ${DEFAULT_EMAIL_TEMPLATE.styling.textColor};
        }

        /* Container */
        .email-container {
            max-width: ${DEFAULT_EMAIL_TEMPLATE.styling.maxWidth};
            margin: 0 auto;
            background-color: ${DEFAULT_EMAIL_TEMPLATE.styling.backgroundColor};
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        /* Header */
        .email-header {
            background-color: ${DEFAULT_EMAIL_TEMPLATE.styling.primaryColor};
            padding: 24px 32px;
            text-align: center;
        }
        .company-name {
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            letter-spacing: -0.025em;
        }

        /* Body */
        .email-body {
            padding: 32px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            color: ${DEFAULT_EMAIL_TEMPLATE.styling.textColor};
        }
        .main-content {
            margin-bottom: 24px;
            line-height: 1.7;
        }
        .main-content p {
            margin-bottom: 16px;
        }
        .call-to-action {
            background-color: #f1f5f9;
            border-left: 4px solid ${DEFAULT_EMAIL_TEMPLATE.styling.primaryColor};
            padding: 16px 20px;
            margin: 24px 0;
            font-style: italic;
            color: ${DEFAULT_EMAIL_TEMPLATE.styling.secondaryColor};
        }

        /* Footer */
        .email-footer {
            background-color: #f8fafc;
            padding: 24px 32px;
            border-top: 1px solid #e2e8f0;
        }
        .signature {
            margin-bottom: 16px;
        }
        .sender-name {
            font-weight: 600;
            font-size: 16px;
            color: ${DEFAULT_EMAIL_TEMPLATE.styling.textColor};
            display: block;
            margin-bottom: 4px;
        }
        .sender-title {
            color: ${DEFAULT_EMAIL_TEMPLATE.styling.secondaryColor};
            font-size: 14px;
            display: block;
            margin-bottom: 2px;
        }
        .sender-company {
            color: ${DEFAULT_EMAIL_TEMPLATE.styling.primaryColor};
            font-weight: 500;
            font-size: 14px;
            display: block;
        }
        .contact-info {
            font-size: 14px;
            color: ${DEFAULT_EMAIL_TEMPLATE.styling.secondaryColor};
        }
        .contact-info a {
            color: ${DEFAULT_EMAIL_TEMPLATE.styling.linkColor};
            text-decoration: none;
        }
        .contact-info a:hover {
            text-decoration: underline;
        }
        .unsubscribe {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
        }
        .unsubscribe a {
            color: #9ca3af;
            text-decoration: underline;
        }

        /* Links */
        a {
            color: ${DEFAULT_EMAIL_TEMPLATE.styling.linkColor};
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }

        /* Responsive design */
        @media only screen and (max-width: 640px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }
            .email-header,
            .email-body,
            .email-footer {
                padding: 20px !important;
            }
            .company-name {
                font-size: 20px !important;
            }
            .greeting {
                font-size: 16px !important;
            }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .email-container {
                background-color: #1f2937 !important;
            }
            .email-body {
                color: #f9fafb !important;
            }
            .email-footer {
                background-color: #111827 !important;
                border-top-color: #374151 !important;
            }
            .greeting,
            .sender-name {
                color: #f9fafb !important;
            }
            .main-content {
                color: #e5e7eb !important;
            }
            .call-to-action {
                background-color: #374151 !important;
                color: #d1d5db !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="email-header">
            <h1 class="company-name">{{SENDER_COMPANY}}</h1>
        </div>

        <!-- Body -->
        <div class="email-body">
            <div class="greeting">Hi {{RECIPIENT_NAME}},</div>
            
            <div class="main-content">
                {{CUSTOM_CONTENT}}
            </div>

            <div class="call-to-action">
                {{CALL_TO_ACTION_TEXT}}
            </div>
        </div>

        <!-- Footer -->
        <div class="email-footer">
            <div class="signature">
                <span class="sender-name">{{SENDER_NAME}}</span>
                <span class="sender-title">{{SENDER_TITLE}}</span>
                <span class="sender-company">{{SENDER_COMPANY}}</span>
            </div>
            
            <div class="contact-info">
                <a href="mailto:{{SENDER_EMAIL}}">{{SENDER_EMAIL}}</a>
                {{SENDER_PHONE}}
            </div>

            <div class="unsubscribe">
                <a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a> from future emails
            </div>
        </div>
    </div>
</body>
</html>`.trim();
}