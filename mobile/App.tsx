// noinspection ES6UnusedImports,JSUnusedGlobalSymbols,JSUnusedLocalSymbols

import React, {useEffect, useRef, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Platform} from 'react-native';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import {AuthNavigator, MainNavigator} from '@navigation/AppNavigator';
import {useAuthStore} from '@store/auth.store';
import {useListsStore} from '@store/lists.store';
import {DialogProvider, Loading, useDialog} from '@/components';
import {LanguageProvider, useTranslation} from '@i18n';
import {ThemeProvider, useAppTheme} from '@theme';
import {LanguageSelectionScreen} from '@/screens/LanguageSelectionScreen';
import authService from '@/services/auth.service';
import {getFriendlyErrorMessage} from '@/lib/errors';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    })
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 1000 * 60 * 5,
        },
    },
});

type PendingInviteAction = { type: 'join' | 'accept'; code: string };

const AppContent = () => {
    const {isAuthenticated, isInitializing, initialize} = useAuthStore();
    const joinList = useListsStore(state => state.joinList);
    const acceptInviteByCode = useListsStore(state => state.acceptInviteByCode);
    const {navigationTheme, statusBarStyle, colors} = useAppTheme();
    const {t} = useTranslation();
    const [pendingInvite, setPendingInvite] = useState<PendingInviteAction | null>(null);
    const {showDialog} = useDialog();
    const hasRegisteredPushToken = useRef(false);

    useEffect(() => {
        initialize();
    }, [initialize]);

    useEffect(() => {
        if (!isAuthenticated) {
            hasRegisteredPushToken.current = false;
            return;
        }

        const canRegisterPush = Platform.OS !== 'web'
            && Constants.appOwnership !== 'expo'
            && Constants.executionEnvironment !== 'storeClient';
        if (!canRegisterPush || hasRegisteredPushToken.current) {
            return;
        }

        let cancelled = false;

        const registerPushToken = async () => {
            try {
                const existing = await Notifications.getPermissionsAsync();
                let finalStatus = existing.status;
                if (existing.status !== 'granted') {
                    const request = await Notifications.requestPermissionsAsync();
                    finalStatus = request.status;
                }
                if (finalStatus !== 'granted' || cancelled) {
                    return;
                }
                const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
                const token = await Notifications.getDevicePushTokenAsync(projectId ? {projectId} : undefined);
                if (!token.data || cancelled) {
                    return;
                }
                await authService.registerDeviceToken(token.data, Platform.OS === 'ios' ? 'ios' : 'android');
                if (!cancelled) {
                    hasRegisteredPushToken.current = true;
                }
            } catch (error) {
                console.error('Push registration failed:', error);
            }
        };

        registerPushToken();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated]);

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
        const subscription = Linking.addEventListener('url', event => handleUrl(event.url));
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
                showDialog({
                    title: t('common.success'),
                    message: successMessages[type],
                });
            } catch (error: any) {
                if (type === 'accept') {
                    const isNotFoundError = error?.statusCode === 404 || /invitation not found/i.test(error?.message || '');
                    if (isNotFoundError) {
                        try {
                            await joinList(code);
                            showDialog({
                                title: t('common.success'),
                                message: successMessages.join,
                            });
                            return;
                        } catch (joinError: any) {
                            showDialog({
                                title: t('common.error'),
                                message: getFriendlyErrorMessage(joinError, errorMessages.join, t),
                            });
                            return;
                        }
                    }
                }
                showDialog({
                    title: t('common.error'),
                    message: getFriendlyErrorMessage(error, errorMessages[type], t),
                });
            }
        };

        executeAction();
    }, [isAuthenticated, pendingInvite, joinList, acceptInviteByCode, t]);

    if (isInitializing) {
        return <Loading/>;
    }

    return <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{flex: 1, backgroundColor: colors.background}}>
            <SafeAreaProvider>
                <NavigationContainer theme={navigationTheme}>
                    {isAuthenticated ? <MainNavigator/> : <AuthNavigator/>}
                </NavigationContainer>
                <StatusBar style={statusBarStyle}/>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    </QueryClientProvider>;
};

const LanguageGate: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const {hasSelectedLanguage} = useTranslation();

    if (!hasSelectedLanguage) {
        return <LanguageSelectionScreen/>;
    }

    return <>{children}</>;
};

export default function App() {
    return <ThemeProvider>
        <LanguageProvider>
            <DialogProvider>
                <LanguageGate>
                    <AppContent/>
                </LanguageGate>
            </DialogProvider>
        </LanguageProvider>
    </ThemeProvider>;
}
