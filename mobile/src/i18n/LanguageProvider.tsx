import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Language, translate} from './translations';
import {Loading} from '@/components';

interface LanguageContextValue {
    language: Language;
    setLanguage: (language: Language) => Promise<void>;
    t: (key: string, params?: Record<string, any>) => string;
    isReady: boolean;
}

const STORAGE_KEY = 'app_language';

const LanguageContext = createContext<LanguageContextValue>({
    language: 'en',
    setLanguage: async () => undefined,
    t: (key: string) => key,
    isReady: false,
});

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const [language, setLanguage] = useState<Language>('en');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const bootstrap = async () => {
            try {
                const storedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
                if (storedLanguage === 'en' || storedLanguage === 'it') {
                    setLanguage(storedLanguage);
                }
            } finally {
                setIsReady(true);
            }
        };

        bootstrap();
    }, []);

    const handleChange = useCallback(async (nextLanguage: Language) => {
        setLanguage(nextLanguage);
        await AsyncStorage.setItem(STORAGE_KEY, nextLanguage);
    }, []);

    const value = useMemo<LanguageContextValue>(() => ({
        language,
        setLanguage: handleChange,
        t: (key: string, params?: Record<string, any>) => translate(language, key, params),
        isReady,
    }), [handleChange, language, isReady]);

    if (!isReady) {
        return <Loading/>;
    }

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);

export const useTranslation = () => {
    const context = useLanguage();
    return {
        t: context.t,
        language: context.language,
        setLanguage: context.setLanguage,
        isReady: context.isReady,
    };
};
