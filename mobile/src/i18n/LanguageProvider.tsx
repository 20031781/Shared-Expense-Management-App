import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Language, translate} from './translations';
import {Loading} from '@components/Loading';

interface LanguageContextValue {
    language: Language;
    setLanguage: (language: Language) => Promise<void>;
    t: (key: string, params?: Record<string, any>) => string;
    isReady: boolean;
    hasSelectedLanguage: boolean;
}

const STORAGE_KEY = 'app_language';
const SELECTION_KEY = 'app_language_selected';

const LanguageContext = createContext<LanguageContextValue>({
    language: 'en',
    setLanguage: async () => undefined,
    t: (key: string) => key,
    isReady: false,
    hasSelectedLanguage: false,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [language, setLanguage] = useState<Language>('en');
    const [isReady, setIsReady] = useState(false);
    const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);

    useEffect(() => {
        const bootstrap = async () => {
            try {
                const [storedLanguage, storedSelection] = await Promise.all([
                    AsyncStorage.getItem(STORAGE_KEY),
                    AsyncStorage.getItem(SELECTION_KEY)
                ]);
                if (storedLanguage === 'en' || storedLanguage === 'it') {
                    setLanguage(storedLanguage);
                }
                if (storedSelection === 'true' || storedLanguage === 'en' || storedLanguage === 'it') {
                    setHasSelectedLanguage(true);
                }
            } finally {
                setIsReady(true);
            }
        };

        bootstrap();
    }, []);

    const handleChange = useCallback(async (nextLanguage: Language) => {
        setLanguage(nextLanguage);
        setHasSelectedLanguage(true);
        await AsyncStorage.multiSet([
            [STORAGE_KEY, nextLanguage],
            [SELECTION_KEY, 'true']
        ]);
    }, []);

    const value = useMemo<LanguageContextValue>(() => ({
        language,
        setLanguage: handleChange,
        t: (key: string, params?: Record<string, any>) => translate(language, key, params),
        isReady,
        hasSelectedLanguage,
    }), [handleChange, language, isReady, hasSelectedLanguage]);

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
        hasSelectedLanguage: context.hasSelectedLanguage,
    };
};
