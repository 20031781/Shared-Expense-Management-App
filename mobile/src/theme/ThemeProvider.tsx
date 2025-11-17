import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Appearance, ColorSchemeName} from 'react-native';
import {
    DarkTheme as NavigationDarkTheme,
    DefaultTheme as NavigationLightTheme,
    Theme as NavigationTheme,
} from '@react-navigation/native';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface AppColors {
    background: string;
    surface: string;
    surfaceSecondary: string;
    text: string;
    secondaryText: string;
    accent: string;
    accentText: string;
    accentSoft: string;
    border: string;
    success: string;
    successBackground: string;
    warning: string;
    warningBackground: string;
    danger: string;
    dangerBackground: string;
    pendingSurface: string;
    inputBackground: string;
    placeholder: string;
    shadow: string;
}

const lightColors: AppColors = {
    background: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceSecondary: '#E5E5EA',
    text: '#1C1C1E',
    secondaryText: '#6C6C70',
    accent: '#007AFF',
    accentText: '#FFFFFF',
    accentSoft: '#E5F1FF',
    border: '#D1D1D6',
    success: '#34C759',
    successBackground: '#E5F7ED',
    warning: '#FF9500',
    warningBackground: '#FFF4E5',
    danger: '#FF3B30',
    dangerBackground: '#FDE8E8',
    pendingSurface: '#E5E5EA',
    inputBackground: '#F2F2F7',
    placeholder: '#8E8E93',
    shadow: '#000000',
};

const darkColors: AppColors = {
    background: '#0D0D0F',
    surface: '#1C1C1E',
    surfaceSecondary: '#2C2C2E',
    text: '#F2F2F7',
    secondaryText: '#9F9FA5',
    accent: '#0A84FF',
    accentText: '#FFFFFF',
    accentSoft: '#0F305C',
    border: '#3A3A3C',
    success: '#30D158',
    successBackground: '#1E3A29',
    warning: '#FFD60A',
    warningBackground: '#3A2F13',
    danger: '#FF453A',
    dangerBackground: '#3C1C1E',
    pendingSurface: '#2C2C2E',
    inputBackground: '#2C2C2E',
    placeholder: '#8E8E93',
    shadow: '#000000',
};

interface ThemeContextValue {
    preference: ThemePreference;
    setPreference: (preference: ThemePreference) => Promise<void>;
    colors: AppColors;
    isDark: boolean;
    navigationTheme: NavigationTheme;
    statusBarStyle: 'light' | 'dark';
}

const STORAGE_KEY = 'app_theme_preference';

const ThemeContext = createContext<ThemeContextValue>({
    preference: 'system',
    setPreference: async () => undefined,
    colors: lightColors,
    isDark: false,
    navigationTheme: NavigationLightTheme,
    statusBarStyle: 'dark',
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [preference, setPreferenceState] = useState<ThemePreference>('system');
    const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

    useEffect(() => {
        const loadPreference = async () => {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored === 'light' || stored === 'dark' || stored === 'system') {
                setPreferenceState(stored);
            }
        };

        loadPreference();
    }, []);

    useEffect(() => {
        const listener = Appearance.addChangeListener(({colorScheme}) => {
            setSystemScheme(colorScheme);
        });

        return () => listener.remove();
    }, []);

    const resolvedScheme = preference === 'system' ? systemScheme ?? 'light' : preference;
    const isDark = resolvedScheme === 'dark';
    const colors = isDark ? darkColors : lightColors;

    const navigationTheme = useMemo<NavigationTheme>(() => {
        const base = isDark ? NavigationDarkTheme : NavigationLightTheme;
        return {
            ...base,
            colors: {
                ...base.colors,
                background: colors.background,
                card: colors.surface,
                text: colors.text,
                border: colors.border,
                primary: colors.accent,
            },
        };
    }, [colors, isDark]);

    const handleChange = useCallback(async (value: ThemePreference) => {
        setPreferenceState(value);
        await AsyncStorage.setItem(STORAGE_KEY, value);
    }, []);

    const value = useMemo<ThemeContextValue>(() => ({
        preference,
        setPreference: handleChange,
        colors,
        isDark,
        navigationTheme,
        statusBarStyle: isDark ? 'light' : 'dark',
    }), [colors, handleChange, isDark, navigationTheme, preference]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => useContext(ThemeContext);
