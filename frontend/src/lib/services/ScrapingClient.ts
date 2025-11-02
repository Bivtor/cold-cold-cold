import type { ScrapingResult } from './WebScraperService.js';

export class ScrapingClient {
    /**
     * Scrape website via API endpoint
     */
    async scrapeWebsite(url: string, maxRetries: number = 2): Promise<ScrapingResult> {
        try {
            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url, maxRetries })
            });

            if (!response.ok) {
                const errorData = await response.json();
                return {
                    success: false,
                    error: {
                        message: errorData.error || 'Failed to scrape website',
                        code: 'API_ERROR',
                        retryable: response.status >= 500
                    }
                };
            }

            return await response.json();
        } catch (error) {
            return {
                success: false,
                error: {
                    message: 'Network error occurred',
                    code: 'NETWORK_ERROR',
                    retryable: true
                }
            };
        }
    }
}

// Export singleton instance
export const scrapingClient = new ScrapingClient();