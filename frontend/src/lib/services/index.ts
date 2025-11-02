// Web scraping services - Note: WebScraperService is server-side only
// Use ScrapingClient for client-side scraping via API
export type { ScrapingResult } from './WebScraperService.js';

// Claude AI services
export { ClaudeService, claudeService } from './ClaudeService.js';
export type { ClaudeServiceResult, EmailRefinementRequest } from './ClaudeService.js';

// Error handling
export { ErrorHandler, ErrorCode, retryWithBackoff } from './ErrorHandler.js';

// Fallback services
export { FallbackService } from './FallbackService.js';
export type { ManualBusinessInput, FallbackResult } from './FallbackService.js';

// Business data orchestration - Note: BusinessDataService is server-side only
// It uses WebScraperService internally
export type { BusinessDataRequest, BusinessDataResult } from './BusinessDataService.js';

// Zoho email services
export { ZohoEmailService, zohoEmailService } from './ZohoEmailService.js';
export type { ZohoEmailServiceResult, SendResult } from './ZohoEmailService.js';

// Email template services
export { EmailTemplateService } from './EmailTemplateService.js';
export { TemplateManager } from './TemplateManager.js';

// Notification services
export { NotificationService } from './NotificationService.js';