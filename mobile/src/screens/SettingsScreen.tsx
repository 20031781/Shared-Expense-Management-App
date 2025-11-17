import React, {useMemo, useState} from 'react';
import {Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {availableLanguages, useTranslation} from '@i18n';
import {AppColors, ThemePreference, useAppTheme} from '@theme';
import {Button} from '@/components';
import {useAuthStore} from '@/store/auth.store';

const themeOptions: { value: ThemePreference; icon: string; labelKey: string }[] = [
    {value: 'light', icon: 'sunny-outline', labelKey: 'settings.themeLight'},
    {value: 'dark', icon: 'moon-outline', labelKey: 'settings.themeDark'},
    {value: 'system', icon: 'phone-portrait-outline', labelKey: 'settings.themeSystem'},
];

export const SettingsScreen: React.FC = () => {
    const {language, setLanguage, t} = useTranslation();
    const {colors, preference, setPreference} = useAppTheme();
    const {logout} = useAuthStore();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const performLogout = async () => {
        try {
            setIsLoggingOut(true);
            await logout();
        } catch (error: any) {
            Alert.alert(t('common.error'), error?.message || t('common.genericError'));
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            t('settings.logoutTitle'),
            t('settings.logoutDescription'),
            [
                {text: t('common.cancel'), style: 'cancel'},
                {
                    text: t('settings.logoutConfirm'),
                    style: 'destructive',
                    onPress: performLogout,
                },
            ]
        );
    };

    const handleSwitchAccount = () => {
        Alert.alert(
            t('settings.switchTitle'),
            t('settings.switchDescription'),
            [
                {text: t('common.cancel'), style: 'cancel'},
                {
                    text: t('settings.switchConfirm'),
                    style: 'default',
                    onPress: performLogout,
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.sectionWrapper}>
                <Text style={styles.header}>{t('settings.languageLabel')}</Text>
                <Text style={styles.description}>{t('settings.languageDescription')}</Text>
                <View style={styles.section}>
                    {availableLanguages.map(({code, labelKey}) => {
                        const isActive = language === code;
                        return (
                            <TouchableOpacity
                                key={code}
                                style={[styles.option, isActive && styles.optionActive]}
                                onPress={() => setLanguage(code)}
                            >
                                <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                                    {t(labelKey)}
                                </Text>
                                {isActive && (
                                    <Ionicons name="checkmark-circle" size={20} color={colors.success}/>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View style={styles.sectionWrapper}>
                <Text style={styles.header}>{t('settings.themeLabel')}</Text>
                <Text style={styles.description}>{t('settings.themeDescription')}</Text>
                <View style={styles.section}>
                    {themeOptions.map(({value, icon, labelKey}) => {
                        const isActive = preference === value;
                        return (
                            <TouchableOpacity
                                key={value}
                                style={[styles.option, isActive && styles.optionActive]}
                                onPress={() => setPreference(value)}
                            >
                                <View style={styles.themeOptionContent}>
                                    <Ionicons name={icon as any} size={20} color={colors.accent}/>
                                    <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                                        {t(labelKey)}
                                    </Text>
                                </View>
                                {isActive && (
                                    <Ionicons name="checkmark-circle" size={20} color={colors.success}/>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View style={styles.sectionWrapper}>
                <Text style={styles.header}>{t('settings.accountTitle')}</Text>
                <Text style={styles.description}>{t('settings.logoutDescription')}</Text>
                <View style={styles.logoutButtons}>
                    <Button
                        title={t('settings.logoutButton')}
                        onPress={handleLogout}
                        variant="danger"
                        loading={isLoggingOut}
                        style={styles.logoutPrimary}
                    />
                    <TouchableOpacity style={styles.logoutSecondary} onPress={handleSwitchAccount}
                                      disabled={isLoggingOut}>
                        <Ionicons name="log-out-outline" size={18} color={colors.accent}/>
                        <Text style={styles.logoutSecondaryText}>{t('settings.logoutSecondary')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.switchInfo}>{t('settings.switchInfo')}</Text>
                </View>
            </View>
        </View>
    );
};

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        container: {
            flex: 1,
            padding: 16,
            gap: 24,
            backgroundColor: colors.background,
        },
        sectionWrapper: {
            gap: 8,
        },
        header: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
        },
        description: {
            fontSize: 14,
            color: colors.secondaryText,
        },
        section: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            overflow: 'hidden',
        },
        option: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomColor: colors.surfaceSecondary,
            borderBottomWidth: StyleSheet.hairlineWidth,
        },
        optionActive: {
            backgroundColor: colors.surfaceSecondary,
        },
        optionLabel: {
            fontSize: 16,
            color: colors.text,
        },
        optionLabelActive: {
            fontWeight: '700',
            color: colors.accent,
        },
        themeOptionContent: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        logoutButtons: {
            gap: 12,
            marginTop: 8,
        },
        logoutPrimary: {
            width: '100%',
        },
        logoutSecondary: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'center',
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.accent,
        },
        logoutSecondaryText: {
            color: colors.accent,
            fontWeight: '600',
        },
        switchInfo: {
            fontSize: 12,
            color: colors.secondaryText,
            textAlign: 'center',
        },
    });
