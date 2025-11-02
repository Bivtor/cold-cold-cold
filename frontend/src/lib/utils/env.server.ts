import { env } from '$env/dynamic/private';

export const serverConfig = {
    claude: {
        apiKey: env.CLAUDE_API_KEY || '',
    },
    zoho: {
        clientId: env.ZOHO_CLIENT_ID || '',
        clientSecret: env.ZOHO_CLIENT_SECRET || '',
        refreshToken: env.ZOHO_REFRESH_TOKEN || '',
        emailAddress: env.ZOHO_EMAIL_ADDRESS || '',
    },
    database: {
        path: env.DATABASE_PATH || './data/cold_email.db',
    },
};

export function validateServerConfig(): { isValid: boolean; missingKeys: string[] } {
    const requiredKeys = [
        'CLAUDE_API_KEY',
        'ZOHO_CLIENT_ID',
        'ZOHO_CLIENT_SECRET',
        'ZOHO_REFRESH_TOKEN',
        'ZOHO_EMAIL_ADDRESS',
    ];

    const missingKeys = requiredKeys.filter(key => !env[key]);

    return {
        isValid: missingKeys.length === 0,
        missingKeys,
    };
}