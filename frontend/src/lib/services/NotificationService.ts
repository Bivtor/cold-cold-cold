import { notifications } from '$lib/stores/notifications.js';
import { ErrorHandler } from './ErrorHandler.js';
import type { UserFriendlyError } from '$lib/types/index.js';

export class NotificationService {
    /**
     * Handle and display an error with user-friendly messaging
     */
    static handleError(error: Error, context?: string): UserFriendlyError {
        let userFriendlyError: UserFriendlyError;

        // Log the original error for debugging
        ErrorHandler.logError(error, context);

        // Determine error type and get user-friendly message
        if (context?.includes('scraping') || context?.includes('scrape')) {
            userFriendlyError = ErrorHandler.handleScrapingError(error);
        } else if (context?.includes('ai') || context?.includes('claude') || context?.includes('generate')) {
            userFriendlyError = ErrorHandler.handleAIServiceError(error);
        } else if (context?.includes('email') || context?.includes('send') || context?.includes('zoho')) {
            userFriendlyError = ErrorHandler.handleEmailServiceError(error);
        } else if (context?.includes('database') || context?.includes('db')) {
            userFriendlyError = ErrorHandler.handleDatabaseError(error);
        } else {
            userFriendlyError = ErrorHandler.handleUnknownError(error);
        }

        // Display error notification
        notifications.error(
            this.getErrorTitle(context),
            userFriendlyError.message,
            {
                action: userFriendlyError.retryable ? {
                    label: 'Retry',
                    handler: () => {
                        // This will be handled by the calling component
                        console.log('Retry requested for:', context);
                    }
                } : undefined
            }
        );

        return userFriendlyError;
    }

    /**
     * Display a success notification
     */
    static showSuccess(title: string, message: string, duration?: number) {
        notifications.success(title, message, { duration });
    }

    /**
     * Display a warning notification
     */
    static showWarning(title: string, message: string, duration?: number) {
        notifications.warning(title, message, { duration });
    }

    /**
     * Display an info notification
     */
    static showInfo(title: string, message: string, duration?: number) {
        notifications.info(title, message, { duration });
    }

    /**
     * Show operation success with context-specific messaging
     */
    static showOperationSuccess(operation: string, details?: string) {
        const title = this.getSuccessTitle(operation);
        const message = details || this.getSuccessMessage(operation);

        notifications.success(title, message, { duration: 3000 });
    }

    /**
     * Show operation start notification (for long-running operations)
     */
    static showOperationStart(operation: string) {
        const title = this.getOperationStartTitle(operation);
        const message = this.getOperationStartMessage(operation);

        notifications.info(title, message, { duration: 2000 });
    }

    /**
     * Get context-appropriate error title
     */
    private static getErrorTitle(context?: string): string {
        if (!context) return 'Error';

        if (context.includes('scraping') || context.includes('scrape')) {
            return 'Website Scraping Failed';
        } else if (context.includes('ai') || context.includes('claude') || context.includes('generate')) {
            return 'Email Generation Failed';
        } else if (context.includes('email') || context.includes('send') || context.includes('zoho')) {
            return 'Email Sending Failed';
        } else if (context.includes('database') || context.includes('db')) {
            return 'Database Error';
        } else if (context.includes('settings') || context.includes('config')) {
            return 'Settings Error';
        } else if (context.includes('note')) {
            return 'Notes Error';
        }

        return 'Operation Failed';
    }

    /**
     * Get context-appropriate success title
     */
    private static getSuccessTitle(operation: string): string {
        switch (operation) {
            case 'scraping':
                return 'Website Scraped Successfully';
            case 'email_generation':
                return 'Email Generated';
            case 'email_sending':
                return 'Email Sent';
            case 'settings_save':
                return 'Settings Saved';
            case 'note_save':
                return 'Note Saved';
            case 'note_delete':
                return 'Note Deleted';
            case 'status_update':
                return 'Status Updated';
            default:
                return 'Success';
        }
    }

    /**
     * Get context-appropriate success message
     */
    private static getSuccessMessage(operation: string): string {
        switch (operation) {
            case 'scraping':
                return 'Business information has been extracted from the website.';
            case 'email_generation':
                return 'Your personalized email has been generated and is ready for review.';
            case 'email_sending':
                return 'Your email has been sent successfully.';
            case 'settings_save':
                return 'Your configuration has been updated.';
            case 'note_save':
                return 'Your note has been saved successfully.';
            case 'note_delete':
                return 'The note has been removed.';
            case 'status_update':
                return 'The email status has been updated.';
            default:
                return 'The operation completed successfully.';
        }
    }

    /**
     * Get operation start title
     */
    private static getOperationStartTitle(operation: string): string {
        switch (operation) {
            case 'scraping':
                return 'Scraping Website';
            case 'email_generation':
                return 'Generating Email';
            case 'email_sending':
                return 'Sending Email';
            default:
                return 'Processing';
        }
    }

    /**
     * Get operation start message
     */
    private static getOperationStartMessage(operation: string): string {
        switch (operation) {
            case 'scraping':
                return 'Extracting business information from the website...';
            case 'email_generation':
                return 'Claude AI is generating your personalized email...';
            case 'email_sending':
                return 'Sending your email through Zoho...';
            default:
                return 'Please wait while we process your request...';
        }
    }

    /**
     * Clear all notifications
     */
    static clearAll() {
        notifications.clear();
    }
}