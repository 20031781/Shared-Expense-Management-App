// noinspection ES6UnusedImports,JSUnusedGlobalSymbols,JSUnusedLocalSymbols

import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import {AuthNavigator, MainNavigator} from '@navigation/AppNavigator';
import {useAuthStore} from '@store/auth.store';
import {Loading} from '@/components';
import {LanguageProvider} from '@i18n';
import {ThemeProvider, useAppTheme} from '@theme';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 1000 * 60 * 5,
        },
    },
});

const AppContent = () => {
    const {isAuthenticated, isLoading, initialize} = useAuthStore();
    const {navigationTheme, statusBarStyle, colors} = useAppTheme();

    useEffect(() => {
        initialize();
    }, []);

    if (isLoading) {
        return <Loading/>;
    }

    return (
        <LanguageProvider>
            <QueryClientProvider client={queryClient}>
                <GestureHandlerRootView style={{flex: 1, backgroundColor: colors.background}}>
                    <SafeAreaProvider>
                        <NavigationContainer theme={navigationTheme}>
                            {isAuthenticated ? <MainNavigator/> : <AuthNavigator/>}
                        </NavigationContainer>
                        <StatusBar style={statusBarStyle}/>
                    </SafeAreaProvider>
                </GestureHandlerRootView>
            </QueryClientProvider>
        </LanguageProvider>
    );
};

export default function App() {
    return (
        <ThemeProvider>
            <AppContent/>
        </ThemeProvider>
    );
}
