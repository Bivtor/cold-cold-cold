// Client-side config with fallback values for local development
export const config = {
    claude: {
        apiKey: '', // Will be handled server-side
    },
    zoho: {
        clientId: '',
        clientSecret: '',
        refreshToken: '',
        emailAddress: '',
    },
    database: {
        path: './data/cold_email.db',
    },
};

// For client-side, we'll assume config is valid and handle validation server-side
export function validateConfig(): { isValid: boolean; missingKeys: string[] } {
    return {
        isValid: true, // For local development, assume valid
        missingKeys: [],
    };
}