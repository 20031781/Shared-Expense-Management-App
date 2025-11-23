type Translator = (key: string, params?: Record<string, any>) => string;

const NETWORK_PATTERNS = [/network error/i, /network request failed/i, /failed to connect/i];
const NETWORK_ERROR_CODES = ['ECONNABORTED', 'ENOTFOUND', 'ETIMEDOUT', 'ERR_NETWORK', 'ERR_CONNECTION_REFUSED'];

export const getFriendlyErrorMessage = (
    error: any,
    fallback: string,
    t: Translator,
): string => {
    const rawMessage = typeof error?.message === 'string' ? error.message.trim() : '';
    const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : undefined;
    const code = typeof error?.code === 'string' ? error.code.toUpperCase() : undefined;
    const isAxiosNetwork = Boolean(error?.isAxiosError && error?.request && !error?.response);
    const isNetworkStatus = statusCode === 0 || statusCode === -1 || (code && NETWORK_ERROR_CODES.includes(code));
    const matchesNetworkPattern = NETWORK_PATTERNS.some(pattern => pattern.test(rawMessage));

    if (isNetworkStatus || isAxiosNetwork || matchesNetworkPattern) {
        return t('common.connectionError');
    }

    if (rawMessage.length > 0) {
        return rawMessage;
    }

    return fallback;
};
