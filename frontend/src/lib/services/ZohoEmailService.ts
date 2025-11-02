import type { EmailData, UserFriendlyError } from '../types/index.js';
import { ErrorHandler, retryWithBackoff } from './ErrorHandler.js';
// Fallback config for local development
const config = {
    zoho: {
        clientId: '',
        clientSecret: '',
        refreshToken: '',
        emailAddress: 'test@example.com',
    }
};

export interface ZohoEmailServiceResult {
    success: boolean;
    data?: SendResult;
    error?: UserFriendlyError;
}

export interface SendResult {
    messageId: string;
    status: 'sent' | 'failed';
    timestamp: Date;
    recipient: string;
}

export interface ZohoAuthResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

export interface ZohoSendResponse {
    data: {
        messageId: string;
        status: string;
    };
    status: {
        code: number;
        description: string;
    };
}

export class ZohoEmailService {
    private accessToken: string | null = null;
    private tokenExpiry: Date | null = null;
    private readonly baseUrl = 'https://mail.zoho.com/api';
    private readonly authUrl = 'https://accounts.zoho.com/oauth/v2/token';

    constructor() {
        // Don't validate configuration on construction to avoid build errors
        // Configuration will be validated when actually using the service
    }

    /**
     * Validate that all required Zoho configuration is present
     */
    private validateConfiguration(): void {
        const required = ['clientId', 'clientSecret', 'refreshToken', 'emailAddress'];
        const missing = required.filter(key => !config.zoho[key as keyof typeof config.zoho]);

        if (missing.length > 0) {
            throw new Error(`Missing Zoho configuration: ${missing.join(', ')}`);
        }
    }

    /**
     * Check if the service is properly configured
     */
    isConfigured(): boolean {
        try {
            this.validateConfiguration();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Send an HTML email through Zoho Mail API
     */
    async sendEmail(emailData: EmailData): Promise<ZohoEmailServiceResult> {
        if (!this.isConfigured()) {
            return {
                success: false,
                error: {
                    message: 'Zoho email service is not configured. Please set your API credentials.',
                    code: 'EMAIL_AUTH_ERROR',
                    retryable: false,
                    suggestedAction: 'Add your Zoho API credentials in the settings.'
                }
            };
        }

        // Use the retry logic with proper error handling
        return await this.retryEmailSend(emailData, 2);
    }

    /**
     * Validate email credentials by attempting to get an access token
     */
    async validateCredentials(): Promise<ZohoEmailServiceResult> {
        try {
            await this.ensureValidAccessToken();
            return {
                success: true,
                data: {
                    messageId: 'validation',
                    status: 'sent',
                    timestamp: new Date(),
                    recipient: 'validation'
                }
            };
        } catch (error) {
            ErrorHandler.logError(error as Error, 'ZohoEmailService.validateCredentials');
            return {
                success: false,
                error: ErrorHandler.handleEmailServiceError(error as Error)
            };
        }
    }

    /**
     * Perform the actual email sending
     */
    private async performEmailSend(emailData: EmailData): Promise<SendResult> {
        // Validate email data before sending
        this.validateEmailData(emailData);

        // Ensure we have a valid access token
        await this.ensureValidAccessToken();

        // Format the email for Zoho API
        const formattedEmail = this.formatEmailForZoho(emailData);

        // Send the email
        const response = await fetch(`${this.baseUrl}/accounts/${this.getAccountId()}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formattedEmail)
        });

        // Handle different HTTP status codes
        if (!response.ok) {
            const errorText = await response.text();

            // Parse error response if it's JSON
            let errorDetails = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorDetails = errorJson.message || errorJson.error_description || errorText;
            } catch {
                // Keep original error text if not JSON
            }

            // Throw specific error based on status code
            switch (response.status) {
                case 401:
                    throw new Error(`Authentication failed: ${errorDetails}`);
                case 403:
                    throw new Error(`Access forbidden: ${errorDetails}`);
                case 429:
                    throw new Error(`Rate limit exceeded: ${errorDetails}`);
                case 500:
                    throw new Error(`Internal server error: ${errorDetails}`);
                case 502:
                case 503:
                case 504:
                    throw new Error(`Service unavailable: ${errorDetails}`);
                default:
                    throw new Error(`Zoho API error (${response.status}): ${errorDetails}`);
            }
        }

        const result: ZohoSendResponse = await response.json();

        // Check if the API call was successful
        if (result.status.code !== 200) {
            throw new Error(`Zoho send failed: ${result.status.description}`);
        }

        // Determine final status based on response
        const finalStatus = this.determineSendStatus(result);

        return {
            messageId: result.data.messageId,
            status: finalStatus,
            timestamp: new Date(),
            recipient: emailData.to
        };
    }

    /**
     * Ensure we have a valid access token, refresh if necessary
     */
    private async ensureValidAccessToken(): Promise<void> {
        // Check if we have a valid token that hasn't expired
        if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
            return;
        }

        // Refresh the access token
        await this.refreshAccessToken();
    }

    /**
     * Refresh the access token using the refresh token
     */
    private async refreshAccessToken(): Promise<void> {
        const params = new URLSearchParams({
            refresh_token: config.zoho.refreshToken,
            client_id: config.zoho.clientId,
            client_secret: config.zoho.clientSecret,
            grant_type: 'refresh_token'
        });

        const response = await fetch(this.authUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: params
        });

        if (!response.ok) {
            const errorText = await response.text();

            // Parse error response if it's JSON
            let errorDetails = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorDetails = errorJson.error_description || errorJson.error || errorText;
            } catch {
                // Keep original error text if not JSON
            }

            // Throw specific error based on status code
            switch (response.status) {
                case 400:
                    throw new Error(`Invalid refresh token or client credentials: ${errorDetails}`);
                case 401:
                    throw new Error(`Authentication failed - refresh token may be expired: ${errorDetails}`);
                case 403:
                    throw new Error(`Access forbidden - check your Zoho account permissions: ${errorDetails}`);
                default:
                    throw new Error(`Zoho auth failed (${response.status}): ${errorDetails}`);
            }
        }

        const authResult: ZohoAuthResponse = await response.json();

        // Validate the response
        if (!authResult.access_token) {
            throw new Error('Invalid auth response: missing access token');
        }

        this.accessToken = authResult.access_token;
        this.tokenExpiry = new Date(Date.now() + (authResult.expires_in * 1000));
    }

    /**
     * Format email data for Zoho API
     */
    private formatEmailForZoho(emailData: EmailData) {
        return {
            fromAddress: emailData.fromEmail,
            toAddress: emailData.to,
            subject: emailData.subject,
            content: emailData.htmlContent,
            mailFormat: 'html',
            fromName: emailData.fromName
        };
    }

    /**
     * Get account ID from email address (simplified approach)
     */
    private getAccountId(): string {
        // For Zoho, the account ID is typically derived from the email domain
        // This is a simplified implementation - in production, you might need to
        // fetch this from the Zoho API or configure it separately
        const domain = config.zoho.emailAddress.split('@')[1];
        return domain.replace('.', '_');
    }

    /**
     * Format HTML email content with proper structure
     */
    private formatHtmlEmail(content: string): string {
        // If content already has HTML structure, return as-is
        if (content.includes('<html>') || content.includes('<!DOCTYPE')) {
            return content;
        }

        // Otherwise, wrap in basic HTML structure
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .email-content {
            background: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .signature {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="email-content">
        ${content.replace(/\n/g, '<br>')}
    </div>
</body>
</html>`.trim();
    }

    /**
     * Get email sending status for tracking
     */
    async getEmailStatus(messageId: string): Promise<ZohoEmailServiceResult> {
        try {
            await this.ensureValidAccessToken();

            const response = await fetch(`${this.baseUrl}/accounts/${this.getAccountId()}/messages/${messageId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get email status: ${response.status}`);
            }

            const result = await response.json();

            return {
                success: true,
                data: {
                    messageId: messageId,
                    status: result.status === 'sent' ? 'sent' : 'failed',
                    timestamp: new Date(result.sentTime || Date.now()),
                    recipient: result.toAddress
                }
            };
        } catch (error) {
            ErrorHandler.logError(error as Error, 'ZohoEmailService.getEmailStatus');
            return {
                success: false,
                error: ErrorHandler.handleEmailServiceError(error as Error)
            };
        }
    }

    /**
     * Validate email data before sending
     */
    private validateEmailData(emailData: EmailData): void {
        if (!emailData.to || !this.isValidEmail(emailData.to)) {
            throw new Error(`Invalid recipient email address: ${emailData.to}`);
        }

        if (!emailData.subject || emailData.subject.trim().length === 0) {
            throw new Error('Email subject is required');
        }

        if (!emailData.htmlContent || emailData.htmlContent.trim().length === 0) {
            throw new Error('Email content is required');
        }

        if (!emailData.fromEmail || !this.isValidEmail(emailData.fromEmail)) {
            throw new Error(`Invalid sender email address: ${emailData.fromEmail}`);
        }

        if (!emailData.fromName || emailData.fromName.trim().length === 0) {
            throw new Error('Sender name is required');
        }
    }

    /**
     * Validate email address format
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Determine final send status based on Zoho response
     */
    private determineSendStatus(result: ZohoSendResponse): 'sent' | 'failed' {
        // Check various indicators of successful sending
        if (result.status.code === 200 && result.data.messageId) {
            // Additional checks based on Zoho's response format
            const status = result.data.status?.toLowerCase();

            if (status === 'sent' || status === 'queued' || status === 'delivered') {
                return 'sent';
            }

            if (status === 'failed' || status === 'rejected' || status === 'bounced') {
                return 'failed';
            }

            // If we have a message ID but unclear status, assume sent
            return 'sent';
        }

        return 'failed';
    }

    /**
     * Update email status in database (to be called by external services)
     */
    async updateEmailStatus(emailId: number, sendResult: SendResult): Promise<void> {
        // This method would typically interact with the database service
        // to update the email status based on the send result
        // For now, we'll just log the status update
        console.log(`Email ${emailId} status updated:`, {
            messageId: sendResult.messageId,
            status: sendResult.status,
            timestamp: sendResult.timestamp,
            recipient: sendResult.recipient
        });
    }

    /**
     * Retry email sending with exponential backoff for transient failures
     */
    async retryEmailSend(emailData: EmailData, maxRetries: number = 2): Promise<ZohoEmailServiceResult> {
        let lastError: Error;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.performEmailSend(emailData);
                return {
                    success: true,
                    data: result
                };
            } catch (error) {
                lastError = error as Error;

                // Check if this is a retryable error
                const userError = ErrorHandler.handleEmailServiceError(lastError);
                if (!ErrorHandler.isRetryable(userError)) {
                    // Don't retry non-retryable errors
                    break;
                }

                // Don't wait after the last attempt
                if (attempt < maxRetries) {
                    const delay = ErrorHandler.getRetryDelay(attempt, 1000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // All retries failed
        return {
            success: false,
            error: ErrorHandler.handleEmailServiceError(lastError!)
        };
    }

    /**
     * Clean up resources
     */
    cleanup(): void {
        this.accessToken = null;
        this.tokenExpiry = null;
    }
}

// Export a singleton instance
export const zohoEmailService = new ZohoEmailService();