import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZohoEmailService } from './ZohoEmailService.js';
import type { EmailData } from '../types/index.js';

// Mock the config
vi.mock('../utils/env.js', () => ({
    config: {
        zoho: {
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            refreshToken: 'test-refresh-token',
            emailAddress: 'test@example.com'
        }
    }
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('ZohoEmailService', () => {
    let service: ZohoEmailService;
    let mockEmailData: EmailData;

    beforeEach(() => {
        service = new ZohoEmailService();
        mockEmailData = {
            to: 'recipient@example.com',
            subject: 'Test Email',
            htmlContent: '<p>Test content</p>',
            fromName: 'Test Sender',
            fromEmail: 'test@example.com'
        };
        vi.clearAllMocks();
    });

    describe('isConfigured', () => {
        it('should return true when all config is present', () => {
            expect(service.isConfigured()).toBe(true);
        });
    });

    describe('validateCredentials', () => {
        it('should return success when auth token can be obtained', async () => {
            // Mock successful auth response
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    access_token: 'test-token',
                    expires_in: 3600,
                    token_type: 'Bearer'
                })
            });

            const result = await service.validateCredentials();
            expect(result.success).toBe(true);
        });

        it('should return error when auth fails', async () => {
            // Mock failed auth response
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 401,
                text: () => Promise.resolve('Unauthorized')
            });

            const result = await service.validateCredentials();
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('EMAIL_AUTH_ERROR');
        });
    });

    describe('sendEmail', () => {
        it('should successfully send email with valid data', async () => {
            // Mock successful auth response
            (global.fetch as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        access_token: 'test-token',
                        expires_in: 3600,
                        token_type: 'Bearer'
                    })
                })
                // Mock successful send response
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        data: {
                            messageId: 'test-message-id',
                            status: 'sent'
                        },
                        status: {
                            code: 200,
                            description: 'Success'
                        }
                    })
                });

            const result = await service.sendEmail(mockEmailData);
            expect(result.success).toBe(true);
            expect(result.data?.messageId).toBe('test-message-id');
            expect(result.data?.status).toBe('sent');
        });

        it('should handle invalid email data', async () => {
            const invalidEmailData = {
                ...mockEmailData,
                to: 'invalid-email'
            };

            const result = await service.sendEmail(invalidEmailData);
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('EMAIL_INVALID_RECIPIENT');
        });

        it('should handle auth failures', async () => {
            // Mock failed auth response
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 401,
                text: () => Promise.resolve('Unauthorized')
            });

            const result = await service.sendEmail(mockEmailData);
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('EMAIL_AUTH_ERROR');
        });

        it('should handle send failures', async () => {
            // Mock successful auth response
            (global.fetch as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        access_token: 'test-token',
                        expires_in: 3600,
                        token_type: 'Bearer'
                    })
                })
                // Mock failed send response
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    text: () => Promise.resolve('Internal Server Error')
                });

            const result = await service.sendEmail(mockEmailData);
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('EMAIL_SEND_ERROR');
        });
    });

    describe('email validation', () => {
        it('should validate email addresses correctly', async () => {
            const testCases = [
                { email: 'valid@example.com', valid: true },
                { email: 'invalid-email', valid: false },
                { email: '', valid: false },
                { email: 'test@', valid: false },
                { email: '@example.com', valid: false }
            ];

            for (const testCase of testCases) {
                const emailData = { ...mockEmailData, to: testCase.email };
                const result = await service.sendEmail(emailData);

                if (testCase.valid) {
                    // Should not fail due to email validation
                    expect(result.error?.code).not.toBe('EMAIL_INVALID_RECIPIENT');
                } else {
                    expect(result.success).toBe(false);
                    expect(result.error?.code).toBe('EMAIL_INVALID_RECIPIENT');
                }
            }
        });
    });
});