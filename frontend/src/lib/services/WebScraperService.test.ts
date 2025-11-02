import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebScraperService } from './WebScraperService.js';
import { ErrorHandler } from './ErrorHandler.js';

describe('WebScraperService', () => {
    let scraperService: WebScraperService;

    beforeEach(() => {
        scraperService = new WebScraperService();
    });

    afterEach(async () => {
        await scraperService.cleanup();
    });

    it('should handle invalid URLs gracefully', async () => {
        const result = await scraperService.scrapeWebsite('invalid-url');

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.requiresManualInput).toBe(true);
        expect(result.suggestions).toBeDefined();
    });



    it('should provide fallback suggestions when scraping fails', async () => {
        const result = await scraperService.scrapeWebsite('invalid-url');

        expect(result.suggestions).toBeDefined();
        expect(result.suggestions!.length).toBeGreaterThan(0);
    });
});

describe('ErrorHandler', () => {
    it('should handle timeout errors correctly', () => {
        const error = new Error('timeout exceeded');
        const result = ErrorHandler.handleScrapingError(error);

        expect(result.code).toBe('TIMEOUT_ERROR');
        expect(result.retryable).toBe(true);
        expect(result.message).toContain('took too long');
    });

    it('should handle invalid URL errors correctly', () => {
        const error = new Error('net::ERR_NAME_NOT_RESOLVED');
        const result = ErrorHandler.handleScrapingError(error);

        expect(result.code).toBe('INVALID_URL');
        expect(result.retryable).toBe(false);
        expect(result.message).toContain('could not be found');
    });

    it('should handle blocked access errors correctly', () => {
        const error = new Error('403 Forbidden');
        const result = ErrorHandler.handleScrapingError(error);

        expect(result.code).toBe('ACCESS_BLOCKED');
        expect(result.retryable).toBe(true);
        expect(result.message).toContain('blocked');
    });
});