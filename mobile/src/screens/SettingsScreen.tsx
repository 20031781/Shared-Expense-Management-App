import React, {useMemo} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {availableLanguages, useTranslation} from '@i18n';
import {AppColors, ThemePreference, useAppTheme} from '@theme';

const themeOptions: {value: ThemePreference; icon: string; labelKey: string}[] = [
    {value: 'light', icon: 'sunny-outline', labelKey: 'settings.themeLight'},
    {value: 'dark', icon: 'moon-outline', labelKey: 'settings.themeDark'},
    {value: 'system', icon: 'phone-portrait-outline', labelKey: 'settings.themeSystem'},
];

export const SettingsScreen: React.FC = () => {
    const {language, setLanguage, t} = useTranslation();
    const {colors, preference, setPreference} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

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
    });
