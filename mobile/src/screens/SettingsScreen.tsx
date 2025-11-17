import React, {useEffect, useMemo, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {availableLanguages, useTranslation} from '@i18n';
import {AppColors, ThemePreference, useAppTheme} from '@theme';
import {Button} from '@/components';
import {useAuthStore} from '@/store/auth.store';
import {NotificationPreferences} from '@/types';

const themeOptions: { value: ThemePreference; icon: string; labelKey: string }[] = [
    {value: 'light', icon: 'sunny-outline', labelKey: 'settings.themeLight'},
    {value: 'dark', icon: 'moon-outline', labelKey: 'settings.themeDark'},
    {value: 'system', icon: 'phone-portrait-outline', labelKey: 'settings.themeSystem'},
];

const defaultNotificationPreferences: NotificationPreferences = {
    newExpense: true,
    memberAdded: true,
    validationRequest: true,
    validationResult: true,
    newReimbursement: true,
};

export const SettingsScreen: React.FC = () => {
    const {language, setLanguage, t} = useTranslation();
    const {colors, preference, setPreference} = useAppTheme();
    const {logout, updateProfile, user} = useAuthStore();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
        ...defaultNotificationPreferences,
        ...(user?.notificationPreferences ?? {}),
    });
    const [savingPreference, setSavingPreference] = useState<keyof NotificationPreferences | null>(null);
    const styles = useMemo(() => createStyles(colors), [colors]);

    useEffect(() => {
        setNotificationPrefs({
            ...defaultNotificationPreferences,
            ...(user?.notificationPreferences ?? {}),
        });
    }, [user?.notificationPreferences]);

    const preferenceOptions = useMemo(() => ([
        {
            key: 'newExpense',
            icon: 'wallet-outline',
            titleKey: 'settings.notifyNewExpense',
            descriptionKey: 'settings.notifyNewExpenseDescription'
        },
        {
            key: 'memberAdded',
            icon: 'person-add-outline',
            titleKey: 'settings.notifyMemberAdded',
            descriptionKey: 'settings.notifyMemberAddedDescription'
        },
        {
            key: 'validationRequest',
            icon: 'shield-checkmark-outline',
            titleKey: 'settings.notifyValidationRequest',
            descriptionKey: 'settings.notifyValidationRequestDescription'
        },
        {
            key: 'validationResult',
            icon: 'notifications-outline',
            titleKey: 'settings.notifyValidationResult',
            descriptionKey: 'settings.notifyValidationResultDescription'
        },
        {
            key: 'newReimbursement',
            icon: 'swap-horizontal-outline',
            titleKey: 'settings.notifyReimbursement',
            descriptionKey: 'settings.notifyReimbursementDescription'
        },
    ] satisfies { key: keyof NotificationPreferences; icon: string; titleKey: string; descriptionKey: string }[]), [t]);

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

    const handleTogglePreference = async (key: keyof NotificationPreferences) => {
        const current = notificationPrefs;
        const nextValue = !current[key];
        const updated = {...current, [key]: nextValue};
        setNotificationPrefs(updated);
        setSavingPreference(key);
        try {
            await updateProfile({notificationPreferences: updated});
        } catch (error: any) {
            setNotificationPrefs(current);
            Alert.alert(t('common.error'), error?.message || t('common.genericError'));
        } finally {
            setSavingPreference(null);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
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
                <Text style={styles.header}>{t('settings.notificationsTitle')}</Text>
                <Text style={styles.description}>{t('settings.notificationsDescription')}</Text>
                <View style={styles.section}>
                    {preferenceOptions.map(({key, icon, titleKey, descriptionKey}, index) => {
                        const value = notificationPrefs[key];
                        const isLast = index === preferenceOptions.length - 1;
                        return (
                            <View
                                key={key}
                                style={[styles.preferenceRow, isLast && styles.preferenceRowLast]}
                            >
                                <View style={styles.preferenceInfo}>
                                    <View style={styles.preferenceIcon}>
                                        <Ionicons name={icon as any} size={18} color={colors.accent}/>
                                    </View>
                                    <View style={styles.preferenceCopy}>
                                        <Text style={styles.preferenceTitle}>{t(titleKey)}</Text>
                                        <Text style={styles.preferenceDescription}>{t(descriptionKey)}</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={value}
                                    onValueChange={() => handleTogglePreference(key)}
                                    trackColor={{false: colors.surfaceSecondary, true: colors.accentSoft}}
                                    thumbColor={value ? colors.accent : colors.surface}
                                    disabled={savingPreference === key || isLoggingOut}
                                />
                            </View>
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
                </View>
            </View>
        </ScrollView>
    );
};

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        scrollContent: {
            padding: 16,
            gap: 24,
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
        preferenceRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.surfaceSecondary,
            gap: 16,
        },
        preferenceRowLast: {
            borderBottomWidth: 0,
        },
        preferenceInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            gap: 12,
        },
        preferenceIcon: {
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surfaceSecondary,
        },
        preferenceCopy: {
            flex: 1,
        },
        preferenceTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
        },
        preferenceDescription: {
            fontSize: 13,
            color: colors.secondaryText,
        },
    });
