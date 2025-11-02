import { describe, it, expect, beforeEach } from 'vitest';
import { ClaudeService } from './ClaudeService.js';
import { ErrorHandler } from './ErrorHandler.js';
import type { EmailGenerationRequest } from '../types/index.js';

describe('ClaudeService', () => {
    let claudeService: ClaudeService;

    beforeEach(() => {
        claudeService = new ClaudeService();
    });

    it('should handle missing API key gracefully', async () => {
        const request: EmailGenerationRequest = {
            personalNotes: 'Test notes',
            promptTemplate: 'Test template',
            businessContext: 'Test context',
            manualContent: 'Test business information'
        };

        const result = await claudeService.generateEmail(request);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error!.code).toBe('AI_API_ERROR');
        expect(result.error!.retryable).toBe(false);
        expect(result.error!.message).toContain('not configured');
    });

    it('should check configuration status correctly', () => {
        expect(claudeService.isConfigured()).toBe(false);

        claudeService.setApiKey('test-key');
        expect(claudeService.isConfigured()).toBe(true);
    });

    it('should handle subject line generation without API key', async () => {
        const result = await claudeService.generateSubjectLine('Test email content', 'Test Business');

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error!.code).toBe('AI_API_ERROR');
        expect(result.error!.retryable).toBe(false);
    });

    it('should handle email refinement without API key', async () => {
        const result = await claudeService.refineEmail({
            originalEmail: 'Original email content',
            feedback: 'Make it shorter'
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error!.code).toBe('AI_API_ERROR');
        expect(result.error!.retryable).toBe(false);
    });

    it('should clean up resources properly', () => {
        claudeService.setApiKey('test-key');
        expect(claudeService.isConfigured()).toBe(true);

        claudeService.cleanup();
        expect(claudeService.isConfigured()).toBe(false);
    });
});

describe('ErrorHandler - AI Service Errors', () => {
    it('should handle rate limit errors correctly', () => {
        const error = new Error('rate_limit_error: Too many requests');
        const result = ErrorHandler.handleAIServiceError(error);

        expect(result.code).toBe('AI_RATE_LIMIT');
        expect(result.retryable).toBe(true);
        expect(result.message).toContain('rate limit');
        expect(result.suggestedAction).toContain('Wait');
    });

    it('should handle authentication errors correctly', () => {
        const error = new Error('invalid_request_error: Invalid API key');
        const result = ErrorHandler.handleAIServiceError(error);

        expect(result.code).toBe('AI_API_ERROR');
        expect(result.retryable).toBe(false);
        expect(result.message).toContain('authentication');
        expect(result.suggestedAction).toContain('API key');
    });

    it('should handle service overload errors correctly', () => {
        const error = new Error('service_unavailable: Claude API is overloaded');
        const result = ErrorHandler.handleAIServiceError(error);

        expect(result.code).toBe('AI_API_ERROR');
        expect(result.retryable).toBe(true);
        expect(result.message).toContain('overloaded');
    });

    it('should handle content policy errors correctly', () => {
        const error = new Error('content_policy: Content flagged by safety filters');
        const result = ErrorHandler.handleAIServiceError(error);

        expect(result.code).toBe('AI_INVALID_RESPONSE');
        expect(result.retryable).toBe(false);
        expect(result.message).toContain('safety filters');
    });

    it('should handle token limit errors correctly', () => {
        const error = new Error('max_tokens exceeded');
        const result = ErrorHandler.handleAIServiceError(error);

        expect(result.code).toBe('AI_INVALID_RESPONSE');
        expect(result.retryable).toBe(false);
        expect(result.message).toContain('too long');
    });

    it('should handle timeout errors correctly', () => {
        const error = new Error('Request timed out');
        const result = ErrorHandler.handleAIServiceError(error);

        expect(result.code).toBe('AI_API_ERROR');
        expect(result.retryable).toBe(true);
        expect(result.message).toContain('timed out');
    });

    it('should handle network errors correctly', () => {
        const error = new Error('network connection failed');
        const result = ErrorHandler.handleAIServiceError(error);

        expect(result.code).toBe('AI_API_ERROR');
        expect(result.retryable).toBe(true);
        expect(result.message).toContain('Network error');
    });

    it('should handle unknown errors with default response', () => {
        const error = new Error('Unknown error occurred');
        const result = ErrorHandler.handleAIServiceError(error);

        expect(result.code).toBe('AI_API_ERROR');
        expect(result.retryable).toBe(true);
        expect(result.message).toContain('encountered an error');
    });
});