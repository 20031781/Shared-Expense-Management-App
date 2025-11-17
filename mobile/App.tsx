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
import {LanguageSelectionScreen} from '@/screens/LanguageSelectionScreen';

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

        const {type, code} = pendingInvite;
        setPendingInvite(null);

        const successMessages = {
            accept: t('lists.acceptSuccess'),
            join: t('lists.joinSuccess')
        } as const;

        const errorMessages = {
            accept: t('lists.acceptError'),
            join: t('lists.joinError')
        } as const;

        const executeAction = async () => {
            try {
                if (type === 'accept') {
                    await acceptInviteByCode(code);
                } else {
                    await joinList(code);
                }
                Alert.alert(t('common.success'), successMessages[type]);
            } catch (error: any) {
                if (type === 'accept') {
                    const isNotFoundError = error?.statusCode === 404 || /invitation not found/i.test(error?.message || '');
                    if (isNotFoundError) {
                        try {
                            await joinList(code);
                            Alert.alert(t('common.success'), successMessages.join);
                            return;
                        } catch (joinError: any) {
                            Alert.alert(t('common.error'), joinError.message || errorMessages.join);
                            return;
                        }
                    }
                }
                Alert.alert(t('common.error'), error.message || errorMessages[type]);
            }
        };

        executeAction();
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

const LanguageGate: React.FC<{children: React.ReactNode}> = ({children}) => {
    const {hasSelectedLanguage} = useTranslation();

    if (!hasSelectedLanguage) {
        return <LanguageSelectionScreen/>;
    }

    return <>{children}</>;
};

export default function App() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <LanguageGate>
                    <AppContent/>
                </LanguageGate>
            </LanguageProvider>
        </ThemeProvider>
    );
}
