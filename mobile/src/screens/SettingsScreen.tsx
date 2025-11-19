import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {availableLanguages, useTranslation} from '@i18n';
import {AppColors, ThemePreference, useAppTheme} from '@theme';
import {Button, useDialog} from '@/components';
import {useAuthStore} from '@/store/auth.store';
import {NotificationPreferences} from '@/types';
import {useSettingsStore, ChartAnimationSpeed} from '@/store/settings.store';
import {getFriendlyErrorMessage} from '@/lib/errors';

const themeOptions: { value: ThemePreference; icon: string; labelKey: string }[] = [
    {value: 'light', icon: 'sunny-outline', labelKey: 'settings.themeLight'},
    {value: 'dark', icon: 'moon-outline', labelKey: 'settings.themeDark'},
    {value: 'system', icon: 'phone-portrait-outline', labelKey: 'settings.themeSystem'},
];

const defaultNotificationPreferences: NotificationPreferences = {
    newExpense: true,
    expenseDeleted: true,
    memberAdded: true,
    validationRequest: true,
    validationResult: true,
    newReimbursement: true,
};

export const SettingsScreen: React.FC = () => {
    const {language, setLanguage, t} = useTranslation();
    const {showDialog} = useDialog();
    const {colors, preference, setPreference} = useAppTheme();
    const {logout, updateProfile, user} = useAuthStore();
    const {chartAnimationSpeed, setChartAnimationSpeed} = useSettingsStore();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
        ...defaultNotificationPreferences,
        ...(user?.notificationPreferences ?? {}),
    });
    const [savingPreference, setSavingPreference] = useState<keyof NotificationPreferences | null>(null);
    const styles = useMemo(() => createStyles(colors), [colors]);

    useEffect(() =>
        setNotificationPrefs({
            ...defaultNotificationPreferences,
            ...(user?.notificationPreferences ?? {}),
        }), [user?.notificationPreferences]);

    const preferenceOptions = useMemo(() => [
        {
            key: 'newExpense',
            icon: 'wallet-outline',
            titleKey: 'settings.notifyNewExpense',
            descriptionKey: 'settings.notifyNewExpenseDescription'
        },
        {
            key: 'expenseDeleted',
            icon: 'trash-outline',
            titleKey: 'settings.notifyExpenseDeleted',
            descriptionKey: 'settings.notifyExpenseDeletedDescription'
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
    ] satisfies { key: keyof NotificationPreferences; icon: string; titleKey: string; descriptionKey: string }[], [t]);

    const performLogout = async () => {
        try {
            setIsLoggingOut(true);
            await logout();
        } catch (error: any) {
            showDialog({
                title: t('common.error'),
                message: getFriendlyErrorMessage(error, t('common.genericError'), t),
            });
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleLogout = () => {
        showDialog({
            title: t('settings.logoutTitle'),
            message: t('settings.logoutDescription'),
            actions: [
                {label: t('common.cancel'), variant: 'ghost'},
                {label: t('settings.logoutConfirm'), variant: 'danger', onPress: performLogout},
            ],
        });
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
            showDialog({
                title: t('common.error'),
                message: getFriendlyErrorMessage(error, t('common.genericError'), t),
            });
        } finally {
            setSavingPreference(null);
        }
    };

    const animationOptions = useMemo(() => [
        {key: 'fast' as ChartAnimationSpeed, label: t('settings.animationFast')},
        {key: 'medium' as ChartAnimationSpeed, label: t('settings.animationMedium')},
        {key: 'slow' as ChartAnimationSpeed, label: t('settings.animationSlow')},
    ], [t]);

    return <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
        <View style={styles.sectionWrapper}>
            <Text style={styles.header}>{t('settings.languageLabel')}</Text>
            <Text style={styles.description}>{t('settings.languageDescription')}</Text>
            <View style={styles.section}>
                {availableLanguages.map(({code, labelKey}) => {
                    const isActive = language === code;
                    return <TouchableOpacity
                        key={code}
                        style={[styles.option, isActive && styles.optionActive]}
                        onPress={() => setLanguage(code)}
                    >
                        <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                            {t(labelKey)}
                        </Text>
                        {isActive && <Ionicons name="checkmark-circle" size={20} color={colors.success}/>}
                    </TouchableOpacity>;
                })}
            </View>
        </View>

        <View style={styles.sectionWrapper}>
            <Text style={styles.header}>{t('settings.themeLabel')}</Text>
            <Text style={styles.description}>{t('settings.themeDescription')}</Text>
            <View style={styles.section}>
                {themeOptions.map(({value, icon, labelKey}) => {
                    const isActive = preference === value;
                    return <TouchableOpacity
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
                        {isActive && <Ionicons name="checkmark-circle" size={20} color={colors.success}/>}
                    </TouchableOpacity>;
                })}
            </View>
        </View>

        <View style={styles.sectionWrapper}>
            <Text style={styles.header}>{t('settings.animationTitle')}</Text>
            <Text style={styles.description}>{t('settings.animationDescription')}</Text>
            <View style={styles.section}>
                {animationOptions.map(option => {
                    const isActive = chartAnimationSpeed === option.key;
                    return <TouchableOpacity
                        key={option.key}
                        style={[styles.option, isActive && styles.optionActive]}
                        onPress={() => setChartAnimationSpeed(option.key)}
                    >
                        <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                            {option.label}
                        </Text>
                        <View style={[styles.speedDot, isActive && styles.speedDotActive]}/>
                    </TouchableOpacity>;
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
                    return <View
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
                    </View>;
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
    </ScrollView>;
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
        speedDot: {
            width: 14,
            height: 14,
            borderRadius: 7,
            borderWidth: 2,
            borderColor: colors.surfaceSecondary,
        },
        speedDotActive: {
            borderColor: colors.accent,
            backgroundColor: colors.accent,
        },
    });
