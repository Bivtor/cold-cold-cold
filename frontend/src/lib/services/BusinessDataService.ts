import type { ScrapedData } from '../types/index.js';
import { WebScraperService, type ScrapingResult } from './WebScraperService.js';
import { FallbackService, type ManualBusinessInput, type FallbackResult } from './FallbackService.js';
import { ErrorHandler } from './ErrorHandler.js';

export interface BusinessDataRequest {
    url?: string;
    manualInput?: ManualBusinessInput;
    preferManual?: boolean;
}

export interface BusinessDataResult {
    success: boolean;
    data?: ScrapedData;
    source: 'scraped' | 'manual' | 'combined';
    requiresManualInput: boolean;
    suggestions?: string[];
    error?: string;
    quality?: {
        score: number;
        issues: string[];
    };
}

/**
 * Service that orchestrates business data collection from multiple sources
 */
export class BusinessDataService {
    private scraperService: WebScraperService;

    constructor() {
        this.scraperService = new WebScraperService();
    }

    /**
     * Get business data using the best available method
     */
    async getBusinessData(request: BusinessDataRequest): Promise<BusinessDataResult> {
        try {
            // If manual input is preferred or no URL provided, use manual input
            if (request.preferManual || !request.url) {
                return this.handleManualInput(request.manualInput);
            }

            // If both URL and manual input provided, try scraping first then merge
            if (request.url && request.manualInput) {
                return this.handleCombinedInput(request.url, request.manualInput);
            }

            // Only URL provided, try scraping with fallback
            if (request.url) {
                return this.handleScrapingWithFallback(request.url);
            }

            // No input provided
            return {
                success: false,
                source: 'manual',
                requiresManualInput: true,
                error: 'No business information provided',
                suggestions: [
                    'Enter a website URL to automatically extract business information',
                    'Or fill in the business details manually for the most accurate results'
                ]
            };

        } catch (error) {
            ErrorHandler.logError(error as Error, 'BusinessDataService.getBusinessData');
            return {
                success: false,
                source: 'manual',
                requiresManualInput: true,
                error: 'An unexpected error occurred while processing business data',
                suggestions: ['Please try entering the business information manually']
            };
        }
    }

    /**
     * Handle manual input only
     */
    private async handleManualInput(manualInput?: ManualBusinessInput): Promise<BusinessDataResult> {
        if (!manualInput) {
            return {
                success: false,
                source: 'manual',
                requiresManualInput: true,
                suggestions: ['Please enter the business information manually']
            };
        }

        const validation = FallbackService.validateManualInput(manualInput);
        if (!validation.valid) {
            return {
                success: false,
                source: 'manual',
                requiresManualInput: true,
                error: validation.errors.join(', '),
                suggestions: ['Please correct the validation errors and try again']
            };
        }

        const scrapedData = FallbackService.convertManualInputToScrapedData(manualInput);

        return {
            success: true,
            data: scrapedData,
            source: 'manual',
            requiresManualInput: false,
            quality: {
                score: 1.0, // Manual input is considered high quality
                issues: []
            }
        };
    }

    /**
     * Handle scraping with fallback to manual input
     */
    private async handleScrapingWithFallback(url: string): Promise<BusinessDataResult> {
        const scrapingResult = await this.scraperService.scrapeWebsite(url);

        if (scrapingResult.success && scrapingResult.data) {
            const quality = this.assessDataQuality(scrapingResult.data);

            return {
                success: true,
                data: scrapingResult.data,
                source: 'scraped',
                requiresManualInput: scrapingResult.requiresManualInput || false,
                suggestions: scrapingResult.suggestions,
                quality
            };
        }

        // Scraping failed, provide fallback guidance
        return {
            success: false,
            source: 'scraped',
            requiresManualInput: true,
            error: scrapingResult.error?.message || 'Failed to scrape website',
            suggestions: scrapingResult.suggestions || [
                'Please enter the business information manually',
                'Visit the website to gather the information needed'
            ]
        };
    }

    /**
     * Handle combined scraping and manual input
     */
    private async handleCombinedInput(url: string, manualInput: ManualBusinessInput): Promise<BusinessDataResult> {
        // Validate manual input first
        const validation = FallbackService.validateManualInput(manualInput);
        if (!validation.valid) {
            return {
                success: false,
                source: 'manual',
                requiresManualInput: true,
                error: validation.errors.join(', ')
            };
        }

        // Try scraping
        const scrapingResult = await this.scraperService.scrapeWebsite(url);

        if (scrapingResult.success && scrapingResult.data) {
            // Merge scraped data with manual input (manual takes precedence)
            const mergedData = FallbackService.mergeScrapedWithManual(scrapingResult.data, manualInput);
            const quality = this.assessDataQuality(mergedData);

            return {
                success: true,
                data: mergedData,
                source: 'combined',
                requiresManualInput: false,
                quality,
                suggestions: [
                    'Business information combined from website and manual input',
                    'Manual input takes precedence where provided'
                ]
            };
        }

        // Scraping failed, use manual input only
        const manualData = FallbackService.convertManualInputToScrapedData(manualInput);

        return {
            success: true,
            data: manualData,
            source: 'manual',
            requiresManualInput: false,
            quality: {
                score: 1.0,
                issues: []
            },
            suggestions: [
                'Website scraping failed, using manual input',
                scrapingResult.error?.message || 'Could not extract information from website'
            ]
        };
    }

    /**
     * Assess data quality
     */
    private assessDataQuality(data: ScrapedData): { score: number; issues: string[] } {
        let score = 0;
        const issues: string[] = [];

        // Business name (required)
        if (data.businessName && data.businessName !== 'Unknown Business' && data.businessName.trim().length > 0) {
            score += 0.3;
        } else {
            issues.push('Business name is missing or generic');
        }

        // Description (important)
        if (data.description && data.description.length > 20) {
            score += 0.25;
        } else if (data.description && data.description.length > 0) {
            score += 0.1;
            issues.push('Business description is very short');
        } else {
            issues.push('Business description is missing');
        }

        // Contact information (important)
        if (data.contactInfo.email) {
            score += 0.2;
        } else {
            issues.push('Email address not found');
        }

        if (data.contactInfo.phone) {
            score += 0.1;
        } else {
            issues.push('Phone number not found');
        }

        // Services (helpful)
        if (data.services && data.services.length > 0) {
            score += 0.1;
        } else {
            issues.push('Services/products information not found');
        }

        // Key content (helpful)
        if (data.keyContent && data.keyContent.length > 0) {
            score += 0.05;
        }

        return { score: Math.min(score, 1.0), issues };
    }

    /**
     * Get suggestions for improving data quality
     */
    getSuggestions(quality: { score: number; issues: string[] }): string[] {
        const suggestions: string[] = [];

        if (quality.score < 0.5) {
            suggestions.push('Consider adding more business details manually for better email personalization');
        }

        if (quality.issues.includes('Business description is missing')) {
            suggestions.push('Add a description of what the business does');
        }

        if (quality.issues.includes('Email address not found')) {
            suggestions.push('Add the business contact email if available');
        }

        if (quality.issues.includes('Services/products information not found')) {
            suggestions.push('List the main services or products the business offers');
        }

        return suggestions;
    }

    /**
     * Clean up resources
     */
    async cleanup(): Promise<void> {
        await this.scraperService.cleanup();
    }
}

// Export singleton instance
export const businessDataService = new BusinessDataService();