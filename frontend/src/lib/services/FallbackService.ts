import type { ScrapedData, UserFriendlyError } from '../types/index.js';

export interface ManualBusinessInput {
    businessName: string;
    description: string;
    website?: string;
    email?: string;
    phone?: string;
    services?: string[];
    notes?: string;
}

export interface FallbackResult {
    success: boolean;
    data?: ScrapedData;
    requiresManualInput: boolean;
    error?: UserFriendlyError;
    suggestions?: string[];
}

export class FallbackService {
    /**
     * Convert manual input to ScrapedData format
     */
    static convertManualInputToScrapedData(input: ManualBusinessInput): ScrapedData {
        return {
            businessName: input.businessName || 'Unknown Business',
            description: input.description || '',
            services: input.services || [],
            contactInfo: {
                email: input.email || '',
                phone: input.phone || '',
                address: ''
            },
            socialMedia: {
                linkedin: '',
                twitter: '',
                facebook: ''
            },
            keyContent: input.notes ? [input.notes] : []
        };
    }

    /**
     * Provide fallback suggestions when scraping fails
     */
    static getFallbackSuggestions(url?: string, error?: UserFriendlyError): string[] {
        const suggestions: string[] = [];

        if (url) {
            // Extract domain for suggestions
            try {
                const domain = new URL(url).hostname.replace('www.', '');
                const businessName = domain.split('.')[0];
                suggestions.push(`Try searching for "${businessName}" on Google to find more information`);
                suggestions.push(`Check if the website has an "About" or "Contact" page`);
                suggestions.push(`Look for the business on LinkedIn or other social media platforms`);
            } catch {
                // Invalid URL, provide general suggestions
            }
        }

        // Add error-specific suggestions
        if (error) {
            switch (error.code) {
                case 'TIMEOUT_ERROR':
                    suggestions.push('The website might be slow - try visiting it manually first');
                    suggestions.push('Check if the website is currently accessible');
                    break;
                case 'ACCESS_BLOCKED':
                    suggestions.push('Visit the website manually to gather the information');
                    suggestions.push('Look for a "Press Kit" or "Media" section that might have business details');
                    break;
                case 'INVALID_URL':
                    suggestions.push('Verify the website URL is correct and complete');
                    suggestions.push('Try adding "https://" if it\'s missing');
                    break;
                default:
                    suggestions.push('Visit the website manually to gather business information');
                    break;
            }
        }

        // Add general suggestions
        suggestions.push('Enter the business information manually for the most accurate results');
        suggestions.push('Focus on key details: business name, what they do, and contact information');

        return suggestions;
    }

    /**
     * Create a fallback result that guides users to manual input
     */
    static createFallbackResult(
        url?: string,
        error?: UserFriendlyError,
        partialData?: Partial<ScrapedData>
    ): FallbackResult {
        const suggestions = this.getFallbackSuggestions(url, error);

        // If we have partial data, use it
        if (partialData) {
            const scrapedData: ScrapedData = {
                businessName: partialData.businessName || 'Unknown Business',
                description: partialData.description || '',
                services: partialData.services || [],
                contactInfo: partialData.contactInfo || { email: '', phone: '', address: '' },
                socialMedia: partialData.socialMedia || { linkedin: '', twitter: '', facebook: '' },
                keyContent: partialData.keyContent || []
            };

            return {
                success: true,
                data: scrapedData,
                requiresManualInput: true,
                suggestions
            };
        }

        return {
            success: false,
            requiresManualInput: true,
            error: error || {
                message: 'Unable to automatically extract business information',
                code: 'SCRAPING_FAILED',
                retryable: false,
                suggestedAction: 'Please enter business information manually'
            },
            suggestions
        };
    }

    /**
     * Validate manual input before conversion
     */
    static validateManualInput(input: ManualBusinessInput): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!input.businessName || input.businessName.trim().length === 0) {
            errors.push('Business name is required');
        }

        if (input.businessName && input.businessName.trim().length > 100) {
            errors.push('Business name should be less than 100 characters');
        }

        if (input.description && input.description.length > 1000) {
            errors.push('Description should be less than 1000 characters');
        }

        if (input.email && !this.isValidEmail(input.email)) {
            errors.push('Please enter a valid email address');
        }

        if (input.website && !this.isValidUrl(input.website)) {
            errors.push('Please enter a valid website URL');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Merge scraped data with manual input (manual input takes precedence)
     */
    static mergeScrapedWithManual(
        scrapedData: ScrapedData,
        manualInput: ManualBusinessInput
    ): ScrapedData {
        return {
            businessName: manualInput.businessName || scrapedData.businessName,
            description: manualInput.description || scrapedData.description,
            services: manualInput.services && manualInput.services.length > 0
                ? manualInput.services
                : scrapedData.services,
            contactInfo: {
                email: manualInput.email || scrapedData.contactInfo.email,
                phone: manualInput.phone || scrapedData.contactInfo.phone,
                address: scrapedData.contactInfo.address
            },
            socialMedia: scrapedData.socialMedia,
            keyContent: manualInput.notes
                ? [...scrapedData.keyContent, manualInput.notes]
                : scrapedData.keyContent
        };
    }

    /**
     * Extract business name from URL as fallback
     */
    static extractBusinessNameFromUrl(url: string): string {
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            const businessName = domain.split('.')[0];
            return businessName.charAt(0).toUpperCase() + businessName.slice(1);
        } catch {
            return 'Unknown Business';
        }
    }

    /**
     * Create empty scraped data structure for manual input
     */
    static createEmptyScrapedData(businessName?: string): ScrapedData {
        return {
            businessName: businessName || 'Unknown Business',
            description: '',
            services: [],
            contactInfo: {
                email: '',
                phone: '',
                address: ''
            },
            socialMedia: {
                linkedin: '',
                twitter: '',
                facebook: ''
            },
            keyContent: []
        };
    }

    /**
     * Validate email format
     */
    private static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate URL format
     */
    private static isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Generate helpful prompts for manual input based on URL
     */
    static generateInputPrompts(url?: string): {
        businessNamePrompt: string;
        descriptionPrompt: string;
        servicesPrompt: string;
    } {
        let businessNamePrompt = 'Enter the business name';
        let descriptionPrompt = 'Describe what this business does';
        let servicesPrompt = 'List the main services or products offered';

        if (url) {
            try {
                const domain = new URL(url).hostname.replace('www.', '');
                const suggestedName = domain.split('.')[0];
                businessNamePrompt = `Enter the business name (e.g., "${suggestedName}")`;
                descriptionPrompt = `Describe what ${suggestedName} does`;
                servicesPrompt = `List the main services ${suggestedName} offers`;
            } catch {
                // Use default prompts
            }
        }

        return {
            businessNamePrompt,
            descriptionPrompt,
            servicesPrompt
        };
    }
}