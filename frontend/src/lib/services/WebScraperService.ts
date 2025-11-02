import { chromium, type Browser, type Page } from 'playwright';
import type { ScrapedData, UserFriendlyError } from '../types/index.js';
import { ErrorHandler, retryWithBackoff } from './ErrorHandler.js';
import { FallbackService, type FallbackResult } from './FallbackService.js';

export interface ScrapingResult {
    success: boolean;
    data?: ScrapedData;
    error?: UserFriendlyError;
    requiresManualInput?: boolean;
    suggestions?: string[];
    partialData?: Partial<ScrapedData>;
}

export class WebScraperService {
    private browser: Browser | null = null;
    private userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
    ];

    /**
     * Scrape website content with stealth capabilities and anti-detection measures
     */
    async scrapeWebsite(url: string, maxRetries: number = 2): Promise<ScrapingResult> {
        try {
            // Validate URL first
            if (!this.isValidUrl(url)) {
                const error = ErrorHandler.handleScrapingError(new Error('Invalid URL format'));
                return this.createFallbackResult(url, error);
            }

            // Use retry utility with exponential backoff
            const result = await retryWithBackoff(
                () => this.attemptScraping(url),
                maxRetries,
                1000,
                (error) => {
                    const userError = ErrorHandler.handleScrapingError(error);
                    return userError.retryable;
                }
            );

            if (result.success && result.data) {
                // Validate scraped data quality
                const dataQuality = this.assessDataQuality(result.data);
                if (dataQuality.score < 0.3) {
                    // Low quality data, suggest manual input
                    return {
                        success: true,
                        data: result.data,
                        requiresManualInput: true,
                        suggestions: [
                            'The scraped information appears incomplete',
                            'Please review and add missing details manually',
                            ...FallbackService.getFallbackSuggestions(url)
                        ],
                        partialData: result.data
                    };
                }
                return result;
            }

            return result;

        } catch (error) {
            ErrorHandler.logError(error as Error, 'WebScraperService.scrapeWebsite');
            const userError = ErrorHandler.handleScrapingError(error as Error);
            return this.createFallbackResult(url, userError);
        }
    }

    /**
     * Create fallback result when scraping fails
     */
    private createFallbackResult(url: string, error: UserFriendlyError, partialData?: Partial<ScrapedData>): ScrapingResult {
        const fallbackResult = FallbackService.createFallbackResult(url, error, partialData);

        return {
            success: false,
            error: fallbackResult.error,
            requiresManualInput: fallbackResult.requiresManualInput,
            suggestions: fallbackResult.suggestions,
            partialData: partialData
        };
    }

    /**
     * Attempt to scrape a website with stealth measures
     */
    private async attemptScraping(url: string): Promise<ScrapingResult> {
        let page: Page | null = null;

        try {
            // Initialize browser with stealth settings
            if (!this.browser) {
                this.browser = await chromium.launch({
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu',
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor'
                    ]
                });
            }

            page = await this.browser.newPage();

            // Apply stealth measures
            await this.applyStealthMeasures(page);

            // Navigate to the website with timeout
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            // Random delay to appear human-like
            await this.randomDelay();

            // Extract business information
            const scrapedData = await this.extractBusinessInfo(page, url);

            return {
                success: true,
                data: scrapedData
            };

        } catch (error) {
            return {
                success: false,
                error: ErrorHandler.handleScrapingError(error as Error)
            };
        } finally {
            if (page) {
                await page.close();
            }
        }
    }

    /**
     * Apply stealth measures to avoid detection
     */
    private async applyStealthMeasures(page: Page): Promise<void> {
        // Set random user agent
        const userAgent = this.getRandomUserAgent();
        await page.setExtraHTTPHeaders({
            'User-Agent': userAgent
        });

        // Set viewport to common resolution
        await page.setViewportSize({
            width: 1366 + Math.floor(Math.random() * 200),
            height: 768 + Math.floor(Math.random() * 200)
        });

        // Override webdriver detection
        await page.addInitScript(() => {
            // Remove webdriver property
            delete (window.navigator as any).webdriver;

            // Override the plugins property
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });

            // Override the languages property
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en']
            });

            // Override the permissions property
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters: any) => {
                if (parameters.name === 'notifications') {
                    return Promise.resolve({
                        state: Notification.permission,
                        name: 'notifications',
                        onchange: null,
                        addEventListener: () => { },
                        removeEventListener: () => { },
                        dispatchEvent: () => true
                    } as PermissionStatus);
                }
                return originalQuery(parameters);
            };
        });

        // Set extra headers
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        });
    }

    /**
     * Extract business information from the page
     */
    private async extractBusinessInfo(page: Page, url: string): Promise<ScrapedData> {
        const businessName = await this.extractBusinessName(page, url);
        const description = await this.extractDescription(page);
        const services = await this.extractServices(page);
        const contactInfo = await this.extractContactInfo(page);
        const socialMedia = await this.extractSocialMedia(page);
        const keyContent = await this.extractKeyContent(page);

        return {
            businessName,
            description,
            services,
            contactInfo,
            socialMedia,
            keyContent
        };
    }

    /**
     * Extract business name from various sources
     */
    private async extractBusinessName(page: Page, url: string): Promise<string> {
        try {
            // Try multiple selectors for business name
            const selectors = [
                'h1',
                '[class*="company"]',
                '[class*="business"]',
                '[class*="brand"]',
                '[class*="logo"] img[alt]',
                'title',
                '[class*="header"] h1',
                '[class*="hero"] h1'
            ];

            for (const selector of selectors) {
                const element = await page.$(selector);
                if (element) {
                    const text = await element.textContent();
                    if (text && text.trim().length > 0 && text.trim().length < 100) {
                        return this.sanitizeContent(text.trim());
                    }

                    // For img elements, try alt attribute
                    if (selector.includes('img[alt]')) {
                        const alt = await element.getAttribute('alt');
                        if (alt && alt.trim().length > 0) {
                            return this.sanitizeContent(alt.trim());
                        }
                    }
                }
            }

            // Fallback to domain name
            const domain = new URL(url).hostname.replace('www.', '');
            return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
        } catch {
            return 'Unknown Business';
        }
    }

    /**
     * Extract business description
     */
    private async extractDescription(page: Page): Promise<string> {
        try {
            const selectors = [
                'meta[name="description"]',
                '[class*="about"]',
                '[class*="description"]',
                '[class*="intro"]',
                '[class*="hero"] p',
                'p:first-of-type'
            ];

            for (const selector of selectors) {
                const element = await page.$(selector);
                if (element) {
                    let text = '';
                    if (selector.includes('meta')) {
                        text = await element.getAttribute('content') || '';
                    } else {
                        text = await element.textContent() || '';
                    }

                    if (text && text.trim().length > 20) {
                        return this.sanitizeContent(text.trim()).substring(0, 500);
                    }
                }
            }

            return '';
        } catch {
            return '';
        }
    }

    /**
     * Extract services offered
     */
    private async extractServices(page: Page): Promise<string[]> {
        try {
            const services: string[] = [];
            const selectors = [
                '[class*="service"]',
                '[class*="product"]',
                '[class*="offering"]',
                'nav a',
                '[class*="menu"] a'
            ];

            for (const selector of selectors) {
                const elements = await page.$$(selector);
                for (const element of elements) {
                    const text = await element.textContent();
                    if (text && text.trim().length > 2 && text.trim().length < 50) {
                        const service = this.sanitizeContent(text.trim());
                        if (!services.includes(service)) {
                            services.push(service);
                        }
                    }
                }

                if (services.length >= 10) break; // Limit to prevent too much data
            }

            return services.slice(0, 10);
        } catch {
            return [];
        }
    }

    /**
     * Extract contact information
     */
    private async extractContactInfo(page: Page) {
        try {
            const contactInfo = {
                email: '',
                phone: '',
                address: ''
            };

            // Extract email
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const pageContent = await page.textContent('body');
            const emailMatches = pageContent?.match(emailRegex);
            if (emailMatches && emailMatches.length > 0) {
                // Filter out common non-business emails
                const businessEmail = emailMatches.find(email =>
                    !email.includes('example.com') &&
                    !email.includes('test.com') &&
                    !email.includes('noreply')
                );
                contactInfo.email = businessEmail || emailMatches[0];
            }

            // Extract phone
            const phoneRegex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
            const phoneMatches = pageContent?.match(phoneRegex);
            if (phoneMatches && phoneMatches.length > 0) {
                contactInfo.phone = phoneMatches[0];
            }

            // Extract address (basic implementation)
            const addressSelectors = [
                '[class*="address"]',
                '[class*="location"]',
                '[class*="contact"] p'
            ];

            for (const selector of addressSelectors) {
                const element = await page.$(selector);
                if (element) {
                    const text = await element.textContent();
                    if (text && text.trim().length > 10 && text.trim().length < 200) {
                        contactInfo.address = this.sanitizeContent(text.trim());
                        break;
                    }
                }
            }

            return contactInfo;
        } catch {
            return { email: '', phone: '', address: '' };
        }
    }

    /**
     * Extract social media links
     */
    private async extractSocialMedia(page: Page) {
        try {
            const socialMedia = {
                linkedin: '',
                twitter: '',
                facebook: ''
            };

            const links = await page.$$('a[href]');

            for (const link of links) {
                const href = await link.getAttribute('href');
                if (href) {
                    if (href.includes('linkedin.com')) {
                        socialMedia.linkedin = href;
                    } else if (href.includes('twitter.com') || href.includes('x.com')) {
                        socialMedia.twitter = href;
                    } else if (href.includes('facebook.com')) {
                        socialMedia.facebook = href;
                    }
                }
            }

            return socialMedia;
        } catch {
            return { linkedin: '', twitter: '', facebook: '' };
        }
    }

    /**
     * Extract key content points
     */
    private async extractKeyContent(page: Page): Promise<string[]> {
        try {
            const keyContent: string[] = [];
            const selectors = [
                'h2',
                'h3',
                '[class*="feature"]',
                '[class*="benefit"]',
                '[class*="highlight"]'
            ];

            for (const selector of selectors) {
                const elements = await page.$$(selector);
                for (const element of elements) {
                    const text = await element.textContent();
                    if (text && text.trim().length > 5 && text.trim().length < 200) {
                        const content = this.sanitizeContent(text.trim());
                        if (!keyContent.includes(content)) {
                            keyContent.push(content);
                        }
                    }
                }

                if (keyContent.length >= 15) break;
            }

            return keyContent.slice(0, 15);
        } catch {
            return [];
        }
    }

    /**
     * Get random user agent
     */
    private getRandomUserAgent(): string {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    /**
     * Add random delay to appear human-like
     */
    private async randomDelay(): Promise<void> {
        const delay = 2000 + Math.random() * 3000; // 2-5 seconds
        await this.sleep(delay);
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Sanitize scraped content
     */
    private sanitizeContent(content: string): string {
        return content
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s\-.,!?()]/g, '')
            .trim();
    }

    /**
     * Validate URL format
     */
    private isValidUrl(url: string): boolean {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }

    /**
     * Assess the quality of scraped data
     */
    private assessDataQuality(data: ScrapedData): { score: number; issues: string[] } {
        let score = 0;
        const issues: string[] = [];

        // Business name (most important)
        if (data.businessName && data.businessName !== 'Unknown Business') {
            score += 0.4;
        } else {
            issues.push('Business name not found');
        }

        // Description
        if (data.description && data.description.length > 20) {
            score += 0.3;
        } else {
            issues.push('Business description missing or too short');
        }

        // Contact info
        if (data.contactInfo.email) {
            score += 0.15;
        } else {
            issues.push('Email address not found');
        }

        if (data.contactInfo.phone) {
            score += 0.1;
        }

        // Services
        if (data.services && data.services.length > 0) {
            score += 0.05;
        }

        return { score, issues };
    }

    /**
     * Clean up resources
     */
    async cleanup(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

// Export singleton instance
export const webScraperService = new WebScraperService();