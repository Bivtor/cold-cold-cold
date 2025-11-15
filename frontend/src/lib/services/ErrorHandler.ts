import type { UserFriendlyError } from '../types/index.js';

export enum ErrorCode {
    // Scraping errors
    TIMEOUT_ERROR = 'TIMEOUT_ERROR',
    INVALID_URL = 'INVALID_URL',
    ACCESS_BLOCKED = 'ACCESS_BLOCKED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    PARSING_ERROR = 'PARSING_ERROR',
    SCRAPING_ERROR = 'SCRAPING_ERROR',

    // AI service errors
    AI_API_ERROR = 'AI_API_ERROR',
    AI_RATE_LIMIT = 'AI_RATE_LIMIT',
    AI_INVALID_RESPONSE = 'AI_INVALID_RESPONSE',

    // Email service errors
    EMAIL_AUTH_ERROR = 'EMAIL_AUTH_ERROR',
    EMAIL_SEND_ERROR = 'EMAIL_SEND_ERROR',
    EMAIL_INVALID_RECIPIENT = 'EMAIL_INVALID_RECIPIENT',

    // Database errors
    DATABASE_ERROR = 'DATABASE_ERROR',
    DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',

    // General errors
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class ErrorHandler {
    /**
     * Handle scraping-related errors
     */
    static handleScrapingError(error: Error): UserFriendlyError {
        const message = error.message.toLowerCase();

        if (message.includes('timeout') || message.includes('timed out')) {
            return {
                message: 'The website took too long to respond. This might be due to slow loading or network issues.',
                code: ErrorCode.TIMEOUT_ERROR,
                retryable: true,
                suggestedAction: 'Try again in a few moments, or enter the business information manually for faster results.'
            };
        }

        if (message.includes('net::err_name_not_resolved') || message.includes('getaddrinfo enotfound')) {
            return {
                message: 'The website URL could not be found. Please check if the URL is correct.',
                code: ErrorCode.INVALID_URL,
                retryable: false,
                suggestedAction: 'Verify the website URL is correct and accessible, or enter business information manually.'
            };
        }

        if (message.includes('403') || message.includes('forbidden') || message.includes('blocked')) {
            return {
                message: 'The website blocked our request. This is common with sites that have anti-bot protection.',
                code: ErrorCode.ACCESS_BLOCKED,
                retryable: true,
                suggestedAction: 'The website may have security measures in place. Please enter the business information manually.'
            };
        }

        if (message.includes('404') || message.includes('not found')) {
            return {
                message: 'The webpage was not found. The URL might be incorrect or the page may have moved.',
                code: ErrorCode.INVALID_URL,
                retryable: false,
                suggestedAction: 'Check if the URL is correct, or try the main website URL instead.'
            };
        }

        if (message.includes('network') || message.includes('connection')) {
            return {
                message: 'Network connection issue occurred while trying to access the website.',
                code: ErrorCode.NETWORK_ERROR,
                retryable: true,
                suggestedAction: 'Check your internet connection and try again, or enter information manually.'
            };
        }

        if (message.includes('parse') || message.includes('parsing')) {
            return {
                message: 'Could not extract business information from the website content.',
                code: ErrorCode.PARSING_ERROR,
                retryable: false,
                suggestedAction: 'The website structure may be unusual. Please enter business information manually.'
            };
        }

        // Default scraping error
        return {
            message: 'Unable to scrape the website. This could be due to various factors like website protection or unusual page structure.',
            code: ErrorCode.SCRAPING_ERROR,
            retryable: true,
            suggestedAction: 'Please enter the business information manually for the best results.'
        };
    }

    /**
     * Handle AI service errors
     */
    static handleAIServiceError(error: Error): UserFriendlyError {
        const message = error.message.toLowerCase();

        // Claude API specific errors
        if (message.includes('rate limit') || message.includes('429') || message.includes('rate_limit_error')) {
            return {
                message: 'Claude API rate limit reached. Please wait a moment before trying again.',
                code: ErrorCode.AI_RATE_LIMIT,
                retryable: true,
                suggestedAction: 'Wait a few minutes and try generating the email again. Consider upgrading your Claude API plan for higher limits.'
            };
        }

        if (message.includes('api key') || message.includes('authentication') || message.includes('401') || message.includes('invalid_request_error')) {
            return {
                message: 'Claude API authentication failed. Please check your API key configuration.',
                code: ErrorCode.AI_API_ERROR,
                retryable: false,
                suggestedAction: 'Verify your CLAUDE_API_KEY is correct and active in the .env file. You can get an API key from console.anthropic.com.'
            };
        }

        if (message.includes('overloaded') || message.includes('503') || message.includes('service_unavailable')) {
            return {
                message: 'Claude API is temporarily overloaded. Please try again in a few moments.',
                code: ErrorCode.AI_API_ERROR,
                retryable: true,
                suggestedAction: 'Wait a few minutes and try again. The service should recover shortly.'
            };
        }

        if (message.includes('timeout') || message.includes('timed out')) {
            return {
                message: 'Claude API request timed out. This may be due to network issues or high server load.',
                code: ErrorCode.AI_API_ERROR,
                retryable: true,
                suggestedAction: 'Check your internet connection and try again.'
            };
        }

        if (message.includes('invalid response') || message.includes('malformed') || message.includes('empty response')) {
            return {
                message: 'Claude API returned an unexpected response format.',
                code: ErrorCode.AI_INVALID_RESPONSE,
                retryable: true,
                suggestedAction: 'Try generating the email again with different input or wait a moment and retry.'
            };
        }

        if (message.includes('content_policy') || message.includes('safety')) {
            return {
                message: 'The content was flagged by Claude\'s safety filters. Please modify your input.',
                code: ErrorCode.AI_INVALID_RESPONSE,
                retryable: false,
                suggestedAction: 'Review your business information and notes for any potentially problematic content, then try again.'
            };
        }

        if (message.includes('token') || message.includes('max_tokens') || message.includes('context_length')) {
            return {
                message: 'The input content is too long for Claude to process.',
                code: ErrorCode.AI_INVALID_RESPONSE,
                retryable: false,
                suggestedAction: 'Try shortening your business description or personal notes, then generate the email again.'
            };
        }

        if (message.includes('network') || message.includes('connection')) {
            return {
                message: 'Network error occurred while connecting to Claude API.',
                code: ErrorCode.AI_API_ERROR,
                retryable: true,
                suggestedAction: 'Check your internet connection and try again.'
            };
        }

        // Default AI service error
        return {
            message: 'Claude API encountered an error while generating the email.',
            code: ErrorCode.AI_API_ERROR,
            retryable: true,
            suggestedAction: 'Try again in a few moments, or create the email content manually if the problem persists.'
        };
    }

    /**
     * Handle email service errors
     */
    static handleEmailServiceError(error: Error): UserFriendlyError {
        const message = error.message.toLowerCase();

        // Authentication errors
        if (message.includes('authentication') || message.includes('401') || message.includes('unauthorized')) {
            return {
                message: 'Email service authentication failed. Please check your Zoho credentials.',
                code: ErrorCode.EMAIL_AUTH_ERROR,
                retryable: false,
                suggestedAction: 'Verify your Zoho email API credentials in the settings.'
            };
        }

        if (message.includes('refresh_token') || message.includes('invalid_grant')) {
            return {
                message: 'Zoho refresh token is invalid or expired. Please re-authenticate.',
                code: ErrorCode.EMAIL_AUTH_ERROR,
                retryable: false,
                suggestedAction: 'Re-authenticate with Zoho and update your refresh token in the settings.'
            };
        }

        if (message.includes('client_id') || message.includes('client_secret')) {
            return {
                message: 'Zoho client credentials are invalid. Please check your client ID and secret.',
                code: ErrorCode.EMAIL_AUTH_ERROR,
                retryable: false,
                suggestedAction: 'Verify your Zoho client ID and client secret in the settings.'
            };
        }

        // Recipient and content errors
        if (message.includes('invalid recipient') || message.includes('invalid email') || message.includes('invalid_email')) {
            return {
                message: 'The recipient email address is invalid or not accepted.',
                code: ErrorCode.EMAIL_INVALID_RECIPIENT,
                retryable: false,
                suggestedAction: 'Check the recipient email address and try again.'
            };
        }

        if (message.includes('blocked') || message.includes('blacklisted')) {
            return {
                message: 'The recipient email address is blocked or blacklisted.',
                code: ErrorCode.EMAIL_INVALID_RECIPIENT,
                retryable: false,
                suggestedAction: 'The recipient may have blocked emails from your domain. Try a different approach.'
            };
        }

        if (message.includes('content') || message.includes('spam')) {
            return {
                message: 'Email content was flagged as spam or contains prohibited content.',
                code: ErrorCode.EMAIL_SEND_ERROR,
                retryable: false,
                suggestedAction: 'Review your email content and remove any potentially problematic text or links.'
            };
        }

        // Rate limiting and quotas
        if (message.includes('quota') || message.includes('limit') || message.includes('rate limit')) {
            return {
                message: 'Email sending limit reached for your account.',
                code: ErrorCode.EMAIL_SEND_ERROR,
                retryable: true,
                suggestedAction: 'Wait until your email quota resets, or upgrade your email service plan.'
            };
        }

        if (message.includes('429') || message.includes('too many requests')) {
            return {
                message: 'Too many email requests. Please slow down your sending rate.',
                code: ErrorCode.EMAIL_SEND_ERROR,
                retryable: true,
                suggestedAction: 'Wait a few minutes before sending more emails.'
            };
        }

        // Server and network errors
        if (message.includes('500') || message.includes('internal server error')) {
            return {
                message: 'Zoho email service is experiencing internal issues.',
                code: ErrorCode.EMAIL_SEND_ERROR,
                retryable: true,
                suggestedAction: 'Try again in a few minutes. If the problem persists, check Zoho service status.'
            };
        }

        if (message.includes('502') || message.includes('503') || message.includes('504')) {
            return {
                message: 'Zoho email service is temporarily unavailable.',
                code: ErrorCode.EMAIL_SEND_ERROR,
                retryable: true,
                suggestedAction: 'The service should recover shortly. Try again in a few minutes.'
            };
        }

        if (message.includes('timeout') || message.includes('timed out')) {
            return {
                message: 'Email sending request timed out.',
                code: ErrorCode.EMAIL_SEND_ERROR,
                retryable: true,
                suggestedAction: 'Check your internet connection and try again.'
            };
        }

        if (message.includes('network') || message.includes('connection')) {
            return {
                message: 'Network error occurred while sending email.',
                code: ErrorCode.EMAIL_SEND_ERROR,
                retryable: true,
                suggestedAction: 'Check your internet connection and try again.'
            };
        }

        // Configuration errors
        if (message.includes('missing zoho configuration') || message.includes('not configured')) {
            return {
                message: 'Zoho email service is not properly configured.',
                code: ErrorCode.EMAIL_AUTH_ERROR,
                retryable: false,
                suggestedAction: 'Add ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, and ZOHO_EMAIL_ADDRESS to your .env file.'
            };
        }

        if (message.includes('account') || message.includes('domain')) {
            return {
                message: 'Issue with your Zoho account or domain configuration.',
                code: ErrorCode.EMAIL_AUTH_ERROR,
                retryable: false,
                suggestedAction: 'Verify your Zoho account is active and properly configured for API access.'
            };
        }

        // Default email service error
        return {
            message: 'Failed to send email through the email service.',
            code: ErrorCode.EMAIL_SEND_ERROR,
            retryable: true,
            suggestedAction: 'Try sending the email again, or check your email service status.'
        };
    }

    /**
     * Handle database errors
     */
    static handleDatabaseError(error: Error): UserFriendlyError {
        const message = error.message.toLowerCase();

        if (message.includes('database is locked') || message.includes('busy')) {
            return {
                message: 'Database is temporarily busy. Please try again.',
                code: ErrorCode.DATABASE_ERROR,
                retryable: true,
                suggestedAction: 'Wait a moment and try your action again.'
            };
        }

        if (message.includes('no such table') || message.includes('syntax error')) {
            return {
                message: 'Database structure issue detected.',
                code: ErrorCode.DATABASE_ERROR,
                retryable: false,
                suggestedAction: 'The application may need to be restarted to fix database issues.'
            };
        }

        return {
            message: 'Database operation failed.',
            code: ErrorCode.DATABASE_ERROR,
            retryable: true,
            suggestedAction: 'Try your action again. If the problem persists, restart the application.'
        };
    }

    /**
     * Generic error handler for unknown errors
     */
    static handleUnknownError(error: Error): UserFriendlyError {
        return {
            message: 'An unexpected error occurred. Please try again.',
            code: ErrorCode.UNKNOWN_ERROR,
            retryable: true,
            suggestedAction: 'If the problem persists, please restart the application.'
        };
    }

    /**
     * Determine if an error is retryable based on its code
     */
    static isRetryable(error: UserFriendlyError): boolean {
        return error.retryable;
    }

    /**
     * Get retry delay based on attempt number (exponential backoff)
     */
    static getRetryDelay(attempt: number, baseDelay: number = 1000): number {
        const exponentialDelay = Math.pow(2, attempt) * baseDelay;
        const jitter = Math.random() * 1000; // Add random jitter
        return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
    }

    /**
     * Log error for debugging purposes
     */
    static logError(error: Error | UserFriendlyError, context?: string): void {
        const timestamp = new Date().toISOString();
        const contextStr = context ? `[${context}] ` : '';

        if ('code' in error) {
            console.error(`${timestamp} ${contextStr}UserFriendlyError: ${error.code} - ${error.message}`);
        } else {
            console.error(`${timestamp} ${contextStr}Error: ${error.message}`, error.stack);
        }
    }
}

/**
 * Retry utility with exponential backoff
 */
export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
    baseDelay: number = 1000,
    shouldRetry?: (error: Error) => boolean
): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            // Check if we should retry this error
            if (shouldRetry && !shouldRetry(lastError)) {
                throw lastError;
            }

            // Don't wait after the last attempt
            if (attempt < maxRetries) {
                const delay = ErrorHandler.getRetryDelay(attempt, baseDelay);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError!;
}