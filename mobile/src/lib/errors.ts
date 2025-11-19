type Translator = (key: string, params?: Record<string, any>) => string;

const NETWORK_PATTERNS = [/network error/i, /network request failed/i, /failed to connect/i];

export const getFriendlyErrorMessage = (
    error: any,
    fallback: string,
    t: Translator,
): string => {
    const rawMessage = typeof error?.message === 'string' ? error.message.trim() : '';
    const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : undefined;
    const isNetworkStatus = statusCode === 0 || statusCode === -1 || (!statusCode && !error?.response);
    const matchesNetworkPattern = NETWORK_PATTERNS.some(pattern => pattern.test(rawMessage));

    if (isNetworkStatus || matchesNetworkPattern) {
        return t('common.connectionError');
    }

    if (rawMessage.length > 0) {
        return rawMessage;
    }

    return fallback;
};
