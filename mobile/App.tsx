// noinspection ES6UnusedImports,JSUnusedGlobalSymbols,JSUnusedLocalSymbols

import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Alert} from 'react-native';
import * as Linking from 'expo-linking';

import {AuthNavigator, MainNavigator} from '@navigation/AppNavigator';
import {useAuthStore} from '@store/auth.store';
import {useListsStore} from '@store/lists.store';
import {Loading} from '@/components';
import {LanguageProvider, useTranslation} from '@i18n';
import {ThemeProvider, useAppTheme} from '@theme';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 1000 * 60 * 5,
        },
    },
});

type PendingInviteAction = {type: 'join' | 'accept'; code: string};

const AppContent = () => {
    const {isAuthenticated, isLoading, initialize} = useAuthStore();
    const joinList = useListsStore((state) => state.joinList);
    const acceptInviteByCode = useListsStore((state) => state.acceptInviteByCode);
    const {navigationTheme, statusBarStyle, colors} = useAppTheme();
    const {t} = useTranslation();
    const [pendingInvite, setPendingInvite] = useState<PendingInviteAction | null>(null);

    useEffect(() => {
        initialize();
    }, []);

    useEffect(() => {
        const handleUrl = (url: string | null) => {
            if (!url) return;
            const parsed = Linking.parse(url);
            const path = parsed?.path ?? '';
            if (path?.startsWith('join/')) {
                const [, code] = path.split('/');
                if (code) setPendingInvite({type: 'join', code: code.toUpperCase()});
            } else if (path?.startsWith('accept/')) {
                const [, code] = path.split('/');
                if (code) setPendingInvite({type: 'accept', code: code.toUpperCase()});
            }
        };

        Linking.getInitialURL().then(handleUrl);
        const subscription = Linking.addEventListener('url', (event) => handleUrl(event.url));
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        if (!isAuthenticated || !pendingInvite) return;
        const action = pendingInvite.type === 'accept' ? acceptInviteByCode : joinList;
        const successMessage = pendingInvite.type === 'accept' ? t('lists.acceptSuccess') : t('lists.joinSuccess');
        const errorMessage = pendingInvite.type === 'accept' ? t('lists.acceptError') : t('lists.joinError');
        const code = pendingInvite.code;
        setPendingInvite(null);

        action(code)
            .then(() => {
                Alert.alert(t('common.success'), successMessage);
            })
            .catch((error: any) => {
                Alert.alert(t('common.error'), error.message || errorMessage);
            });
    }, [isAuthenticated, pendingInvite, joinList, acceptInviteByCode, t]);

    if (isLoading) {
        return <Loading/>;
    }

    return (
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
    );
};

export default function App() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <AppContent/>
            </LanguageProvider>
        </ThemeProvider>
    );
}
