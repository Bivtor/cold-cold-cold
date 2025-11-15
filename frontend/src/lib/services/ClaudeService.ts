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
            model: 'claude-3-5-sonnet-20241022',
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
            model: 'claude-3-5-sonnet-20241022',
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
        let prompt = `Write a personalized cold email based on this info:

BUSINESS CONTEXT:
${request.businessContext}

PERSONAL NOTES:
${request.personalNotes}

TEMPLATE:
${request.promptTemplate}
`;

        // Add manual content if provided (primary input method)
        if (request.manualContent) {
            prompt += `
BUSINESS INFO:
${request.manualContent}
`;
        }

        // Add scraped data if available (secondary input method)
        if (request.scrapedData) {
            prompt += `
SCRAPED DATA:
Business: ${request.scrapedData.businessName}
Description: ${request.scrapedData.description}
Services: ${request.scrapedData.services.join(', ')}
`;

            if (request.scrapedData.contactInfo.email) {
                prompt += `Email: ${request.scrapedData.contactInfo.email}
`;
            }

            if (request.scrapedData.keyContent.length > 0) {
                prompt += `Key Content: ${request.scrapedData.keyContent.join(', ')}
`;
            }
        }

        prompt += `
REQUIREMENTS:
- Keep it 150-250 words
- Show you've researched them
- Clear value proposition
- Casual, friendly tone (not stiff or corporate)
- Personal, not templated
- End with a low-commitment call to action
- DO NOT include a sign-off (no "Best regards", "Cheers", etc.)

FORMAT:
- Return as HTML
- Use <br><br> for paragraph breaks
- Use simple HTML for emphasis (<strong>, <em>) if needed
- NO CSS styling
- Return ONLY the email body (no subject line, no explanations)`;

        return prompt;
    }

    /**
     * Build the prompt for email refinement
     */
    private buildEmailRefinementPrompt(request: EmailRefinementRequest): string {
        let prompt = `Refine this cold email based on the feedback:

ORIGINAL EMAIL:
${request.originalEmail}

FEEDBACK:
${request.feedback}
`;

        if (request.context) {
            prompt += `
CONTEXT:
${request.context}
`;
        }

        prompt += `
REQUIREMENTS:
- Address the feedback while keeping the core message
- Keep it 150-250 words
- Casual, friendly tone
- Keep it personal and researched
- Preserve good elements from the original
- DO NOT include a sign-off (no "Best regards", "Cheers", etc.)

FORMAT:
- Return as HTML
- Use <br><br> for paragraph breaks
- Use simple HTML for emphasis (<strong>, <em>) if needed
- NO CSS styling
- Return ONLY the email body (no subject line, no explanations)`;

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
                model: 'claude-sonnet-4-5-20250929',
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