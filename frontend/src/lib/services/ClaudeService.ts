import Anthropic from '@anthropic-ai/sdk';
import type { EmailGenerationRequest, UserFriendlyError, ScrapedData } from '../types/index.js';
import { ErrorHandler, retryWithBackoff } from './ErrorHandler.js';

export interface ClaudeServiceResult {
    success: boolean;
    data?: string;
    error?: UserFriendlyError;
}

export interface EmailRefinementRequest {
    originalEmail: string;
    feedback: string;
    context?: string;
}

export class ClaudeService {
    private client: Anthropic | null = null;
    private apiKey: string | null = null;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || null;
        if (this.apiKey) {
            this.initializeClient();
        }
    }

    private initializeClient(): void {
        if (!this.apiKey) {
            throw new Error('Claude API key is required');
        }

        this.client = new Anthropic({
            apiKey: this.apiKey,
        });
    }

    /**
     * Set or update the API key
     */
    setApiKey(apiKey: string): void {
        this.apiKey = apiKey;
        this.initializeClient();
    }

    /**
     * Check if the service is properly configured
     */
    isConfigured(): boolean {
        return this.client !== null && this.apiKey !== null;
    }

    /**
     * Generate a personalized cold email using Claude API
     */
    async generateEmail(request: EmailGenerationRequest): Promise<ClaudeServiceResult> {
        if (!this.isConfigured()) {
            return {
                success: false,
                error: {
                    message: 'Claude API is not configured. Please set your API key in the .env file.',
                    code: 'AI_API_ERROR',
                    retryable: false,
                    suggestedAction: 'Add CLAUDE_API_KEY to your .env file. Get an API key from console.anthropic.com.'
                }
            };
        }

        try {
            const result = await retryWithBackoff(
                () => this.performEmailGeneration(request),
                2, // max retries
                1000, // base delay
                (error) => {
                    const userError = ErrorHandler.handleAIServiceError(error);
                    return ErrorHandler.isRetryable(userError);
                }
            );

            return {
                success: true,
                data: result
            };
        } catch (error) {
            ErrorHandler.logError(error as Error, 'ClaudeService.generateEmail');
            return {
                success: false,
                error: ErrorHandler.handleAIServiceError(error as Error)
            };
        }
    }

    /**
     * Refine an existing email based on feedback
     */
    async refineEmail(request: EmailRefinementRequest): Promise<ClaudeServiceResult> {
        if (!this.isConfigured()) {
            return {
                success: false,
                error: {
                    message: 'Claude API is not configured. Please set your API key in the .env file.',
                    code: 'AI_API_ERROR',
                    retryable: false,
                    suggestedAction: 'Add CLAUDE_API_KEY to your .env file. Get an API key from console.anthropic.com.'
                }
            };
        }

        try {
            const result = await retryWithBackoff(
                () => this.performEmailRefinement(request),
                2, // max retries
                1000, // base delay
                (error) => {
                    const userError = ErrorHandler.handleAIServiceError(error);
                    return ErrorHandler.isRetryable(userError);
                }
            );

            return {
                success: true,
                data: result
            };
        } catch (error) {
            ErrorHandler.logError(error as Error, 'ClaudeService.refineEmail');
            return {
                success: false,
                error: ErrorHandler.handleAIServiceError(error as Error)
            };
        }
    }

    /**
     * Perform the actual email generation with Claude API
     */
    private async performEmailGeneration(request: EmailGenerationRequest): Promise<string> {
        const prompt = this.buildEmailGenerationPrompt(request);

        const response = await this.client!.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            temperature: 0.7,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        if (!response.content || response.content.length === 0) {
            throw new Error('Claude API returned empty response');
        }

        const content = response.content[0];
        if (content.type !== 'text') {
            throw new Error('Claude API returned non-text response');
        }

        return content.text.trim();
    }

    /**
     * Perform email refinement with Claude API
     */
    private async performEmailRefinement(request: EmailRefinementRequest): Promise<string> {
        const prompt = this.buildEmailRefinementPrompt(request);

        const response = await this.client!.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            temperature: 0.7,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        if (!response.content || response.content.length === 0) {
            throw new Error('Claude API returned empty response');
        }

        const content = response.content[0];
        if (content.type !== 'text') {
            throw new Error('Claude API returned non-text response');
        }

        return content.text.trim();
    }

    /**
     * Build the prompt for email generation
     */
    private buildEmailGenerationPrompt(request: EmailGenerationRequest): string {
        let prompt = `You are an expert at writing personalized cold emails that get responses. Generate a professional, engaging cold email based on the following information:

BUSINESS CONTEXT:
${request.businessContext}

PERSONAL NOTES/ANALYSIS:
${request.personalNotes}

PROMPT TEMPLATE:
${request.promptTemplate}
`;

        // Add manual content if provided (primary input method)
        if (request.manualContent) {
            prompt += `
MANUAL BUSINESS INFORMATION:
${request.manualContent}
`;
        }

        // Add scraped data if available (secondary input method)
        if (request.scrapedData) {
            prompt += `
SCRAPED WEBSITE DATA:
Business Name: ${request.scrapedData.businessName}
Description: ${request.scrapedData.description}
Services: ${request.scrapedData.services.join(', ')}
`;

            if (request.scrapedData.contactInfo.email) {
                prompt += `Contact Email: ${request.scrapedData.contactInfo.email}
`;
            }

            if (request.scrapedData.keyContent.length > 0) {
                prompt += `Key Content: ${request.scrapedData.keyContent.join(', ')}
`;
            }
        }

        prompt += `
REQUIREMENTS:
1. Write a personalized cold email that demonstrates you've researched the business
2. Keep it concise (150-250 words)
3. Include a clear value proposition
4. End with a specific, low-commitment call to action
5. Use a professional but conversational tone
6. Make it feel personal, not templated
7. Focus on how you can help solve their potential problems or improve their business

Return ONLY the email content without any additional formatting, explanations, or metadata. Do not include subject line - just the email body.`;

        return prompt;
    }

    /**
     * Build the prompt for email refinement
     */
    private buildEmailRefinementPrompt(request: EmailRefinementRequest): string {
        let prompt = `Please refine the following cold email based on the feedback provided:

ORIGINAL EMAIL:
${request.originalEmail}

FEEDBACK:
${request.feedback}
`;

        if (request.context) {
            prompt += `
ADDITIONAL CONTEXT:
${request.context}
`;
        }

        prompt += `
REQUIREMENTS:
1. Address the specific feedback while maintaining the email's core message
2. Keep it concise (150-250 words)
3. Maintain a professional but conversational tone
4. Ensure the email still feels personal and researched
5. Preserve any good elements from the original email

Return ONLY the refined email content without any additional formatting, explanations, or metadata. Do not include subject line - just the email body.`;

        return prompt;
    }

    /**
     * Generate a subject line for an email
     */
    async generateSubjectLine(emailContent: string, businessName: string): Promise<ClaudeServiceResult> {
        if (!this.isConfigured()) {
            return {
                success: false,
                error: {
                    message: 'Claude API is not configured. Please set your API key in the .env file.',
                    code: 'AI_API_ERROR',
                    retryable: false,
                    suggestedAction: 'Add CLAUDE_API_KEY to your .env file. Get an API key from console.anthropic.com.'
                }
            };
        }

        try {
            const prompt = `Generate a compelling subject line for this cold email to ${businessName}:

EMAIL CONTENT:
${emailContent}

REQUIREMENTS:
1. Keep it under 50 characters
2. Make it personal and specific to the business
3. Avoid spam trigger words
4. Create curiosity without being clickbait
5. Make it professional

Return ONLY the subject line without quotes or additional text.`;

            const response = await this.client!.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 100,
                temperature: 0.7,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            if (!response.content || response.content.length === 0) {
                throw new Error('Claude API returned empty response');
            }

            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Claude API returned non-text response');
            }

            return {
                success: true,
                data: content.text.trim()
            };
        } catch (error) {
            ErrorHandler.logError(error as Error, 'ClaudeService.generateSubjectLine');
            return {
                success: false,
                error: ErrorHandler.handleAIServiceError(error as Error)
            };
        }
    }

    /**
     * Clean up resources
     */
    cleanup(): void {
        this.client = null;
        this.apiKey = null;
    }
}