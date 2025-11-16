import React, {useMemo, useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View,} from 'react-native';
import {Button, Input, Loading} from '@/components';
import {useAuthStore} from '@/store/auth.store';
import {useTranslation} from '@i18n';
import {AppColors, useAppTheme} from '@theme';

export const LoginScreen: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const {login, signUp, isLoading} = useAuthStore();
    const {t} = useTranslation();
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const handleSubmit = async () => {
        if (!email || !password) {
            Alert.alert(t('common.error'), t('auth.missingFields'));
            return;
        }

        try {
            if (isSignUp) {
                await signUp(email, password);
                Alert.alert(t('common.success'), t('auth.signUpSuccess'));
            } else {
                await login(email, password);
            }
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message || t('common.genericError'));
        }
    };

    if (isLoading) {
        return <Loading/>;
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logo}>💰</Text>
                        <Text style={styles.title}>{t('auth.title')}</Text>
                        <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <Input
                            placeholder={t('auth.emailPlaceholder')}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Input
                            placeholder={t('auth.passwordPlaceholder')}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                        />

                        <Button
                            title={isSignUp ? t('auth.signUp') : t('auth.signIn')}
                            onPress={handleSubmit}
                            disabled={isLoading}
                            loading={isLoading}
                            style={styles.submitButton}
                        />

                        <Button
                            title={isSignUp ? t('auth.toggleToSignIn') : t('auth.toggleToSignUp')}
                            onPress={() => setIsSignUp(!isSignUp)}
                            variant="outline"
                            style={styles.switchButton}
                        />
                    </View>

                    <Text style={styles.terms}>{t('auth.terms')}</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        scrollContent: {
            flexGrow: 1,
        },
        content: {
            flex: 1,
            justifyContent: 'space-between',
            padding: 24,
        },
        logoContainer: {
            alignItems: 'center',
            marginTop: 60,
            marginBottom: 40,
            gap: 8,
        },
        logo: {
            fontSize: 64,
        },
        title: {
            fontSize: 32,
            fontWeight: '700',
            color: colors.text,
        },
        subtitle: {
            fontSize: 16,
            color: colors.secondaryText,
            textAlign: 'center',
        },
        formContainer: {
            gap: 16,
        },
        submitButton: {
            marginTop: 8,
        },
        switchButton: {
            marginTop: 8,
        },
        terms: {
            fontSize: 12,
            color: colors.secondaryText,
            textAlign: 'center',
            marginTop: 24,
            paddingHorizontal: 20,
        },
    });
