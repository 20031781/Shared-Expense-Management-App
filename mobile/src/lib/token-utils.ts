import {AuthTokens} from '@/types';

const DEFAULT_EXPIRY_MINUTES = Number(process.env.EXPO_PUBLIC_JWT_EXPIRY_MINUTES || '55');

export function buildAuthTokens(accessToken: string, refreshToken: string, expiryMinutes = DEFAULT_EXPIRY_MINUTES): AuthTokens {
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();
    return {
        accessToken,
        refreshToken,
        expiresAt,
    };
}
