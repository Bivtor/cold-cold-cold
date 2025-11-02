# Web Scraping Services

This directory contains the web scraping services with anti-detection capabilities and comprehensive error handling for the Cold Email Pipeline.

## Services Overview

### WebScraperService

Core web scraping service with stealth capabilities:

- Uses Playwright with anti-detection measures
- Implements user agent rotation and random delays
- Extracts business information from websites
- Provides comprehensive error handling

### ErrorHandler

Centralized error handling for all services:

- Converts technical errors to user-friendly messages
- Provides retry logic with exponential backoff
- Categorizes errors by type and retryability

### FallbackService

Handles fallback scenarios when scraping fails:

- Converts manual input to structured data
- Provides helpful suggestions for data collection
- Validates user input before processing

### BusinessDataService

Orchestrates data collection from multiple sources:

- Combines scraping with manual input
- Assesses data quality and completeness
- Provides intelligent fallback strategies

### ClaudeService

AI-powered email generation using Claude API:

- Generates personalized cold emails from business data and personal notes
- Supports email refinement based on feedback
- Includes comprehensive error handling and retry logic
- Provides subject line generation capabilities

## Usage Examples

### Basic Web Scraping

```typescript
import { webScraperService } from '$lib/services';

const result = await webScraperService.scrapeWebsite('https://example.com');

if (result.success && result.data) {
    console.log('Business Name:', result.data.businessName);
    console.log('Description:', result.data.description);
    console.log('Contact Email:', result.data.contactInfo.email);
} else {
    console.log('Scraping failed:', result.error?.message);
    console.log('Suggestions:', result.suggestions);
}
```

### Using BusinessDataService (Recommended)

```typescript
import { businessDataService } from '$lib/services';

// Scraping with fallback
const result = await businessDataService.getBusinessData({
    url: 'https://example.com'
});

// Manual input only
const manualResult = await businessDataService.getBusinessData({
    manualInput: {
        businessName: 'Acme Corp',
        description: 'Software development company',
        email: 'contact@acme.com'
    }
});

// Combined approach
const combinedResult = await businessDataService.getBusinessData({
    url: 'https://example.com',
    manualInput: {
        businessName: 'Acme Corp',
        description: 'Override scraped description'
    }
});
```

### Using ClaudeService

```typescript
import { claudeService } from '$lib/services';
import type { EmailGenerationRequest } from '$lib/types';

// Configure API key (usually done once at startup)
claudeService.setApiKey('your-claude-api-key');

// Generate email from business data
const emailRequest: EmailGenerationRequest = {
    manualContent: 'Acme Corp is a software development company...',
    personalNotes: 'They seem to focus on enterprise solutions...',
    promptTemplate: 'Write a professional cold email offering web development services',
    businessContext: 'B2B software company looking for development partners'
};

const result = await claudeService.generateEmail(emailRequest);

if (result.success) {
    console.log('Generated email:', result.data);
} else {
    console.log('Error:', result.error?.message);
    console.log('Suggested action:', result.error?.suggestedAction);
}

// Generate subject line
const subjectResult = await claudeService.generateSubjectLine(
    result.data!,
    'Acme Corp'
);

// Refine email based on feedback
const refinedResult = await claudeService.refineEmail({
    originalEmail: result.data!,
    feedback: 'Make it shorter and more direct',
    context: 'This is for a busy CEO'
});
```

### Error Handling

```typescript
import { ErrorHandler, retryWithBackoff } from '$lib/services';

try {
    const result = await retryWithBackoff(
        () => someOperation(),
        2, // max retries
        1000, // base delay
        (error) => ErrorHandler.isRetryable(ErrorHandler.handleScrapingError(error))
    );
} catch (error) {
    const userError = ErrorHandler.handleScrapingError(error);
    console.log('User-friendly error:', userError.message);
    console.log('Suggested action:', userError.suggestedAction);
}
```

## Anti-Detection Features

The WebScraperService includes several anti-detection measures:

1. **User Agent Rotation**: Randomly selects from common browser user agents
2. **Random Delays**: Adds 2-5 second delays between actions to appear human-like
3. **Stealth Mode**: Removes webdriver properties and overrides detection methods
4. **Realistic Headers**: Sets appropriate HTTP headers for each request
5. **Variable Viewport**: Uses random viewport sizes within common ranges

## Error Handling Strategy

The services implement a comprehensive error handling strategy:

1. **Categorization**: Errors are categorized by type (timeout, blocked, invalid URL, etc.)
2. **User-Friendly Messages**: Technical errors are converted to understandable messages
3. **Retry Logic**: Retryable errors use exponential backoff with jitter
4. **Fallback Guidance**: Provides specific suggestions for each error type
5. **Graceful Degradation**: Falls back to manual input when scraping fails

## Data Quality Assessment

The BusinessDataService assesses data quality based on:

- **Business Name** (30% weight): Must be present and not generic
- **Description** (25% weight): Should be meaningful and descriptive
- **Contact Email** (20% weight): Valid email format
- **Phone Number** (10% weight): Valid phone format
- **Services** (10% weight): List of offered services
- **Additional Content** (5% weight): Extra contextual information

Quality scores below 0.5 trigger suggestions for manual input improvement.

## Best Practices

1. **Always use BusinessDataService** for production code - it provides the best user experience
2. **Handle errors gracefully** - provide clear feedback to users about what went wrong
3. **Respect rate limits** - the services include built-in delays and retry logic
4. **Clean up resources** - call `cleanup()` methods when done with services
5. **Validate input** - use FallbackService validation for manual input
6. **Provide fallback options** - always offer manual input as an alternative

## Testing

Run the test suite with:

```bash
npm run test
```

The tests cover:

- Error handling for various failure scenarios
- Data validation and quality assessment
- Service integration and fallback behavior
- Edge cases and boundary conditions
